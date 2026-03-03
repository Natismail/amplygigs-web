// src/app/api/release-funds/route.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CURRENCY_SYMBOLS = {
  NGN: '₦', USD: '$', GBP: '£', EUR: '€',
  GHS: '₵', KES: 'KSh', ZAR: 'R'
};

function formatCurrency(amount, currency = 'NGN') {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${Number(amount).toLocaleString()}`;
}

export async function POST(req) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return Response.json({ success: false, error: 'Booking ID is required' }, { status: 400 });
    }

    console.log('📤 Release request for booking:', bookingId);

    // 1. Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        musician:musician_id(id, first_name, last_name, email),
        client:client_id(id, first_name, last_name, email)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('❌ Booking not found:', bookingError);
      return Response.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    // 2. Verify booking is completed or event date has passed
    const eventDate = new Date(booking.event_date);
    const now = new Date();

    if (booking.status !== 'completed' && eventDate >= now) {
      return Response.json({
        success: false,
        error: 'Event must be completed or date must have passed before releasing funds'
      }, { status: 400 });
    }

    // 3. Check if funds already released
    if (booking.funds_released_at) {
      return Response.json({
        success: false,
        error: 'Funds have already been released for this booking'
      }, { status: 400 });
    }

    // 4. Find escrow — broad search covering all pre-release statuses
    //    status can be 'held' or 'pending', payment_status must be 'successful'
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('booking_id', bookingId)
      .in('status', ['held', 'pending'])
      .eq('payment_status', 'successful')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (escrowError) {
      console.error('❌ Escrow lookup error:', escrowError);
      return Response.json({
        success: false,
        error: 'Error looking up escrow record',
        details: escrowError.message
      }, { status: 500 });
    }

    if (!escrow) {
      // Check if any escrow exists at all — gives a better error message
      const { data: anyEscrow } = await supabase
        .from('escrow_transactions')
        .select('id, status, payment_status, gross_amount, net_amount')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (anyEscrow) {
        console.log('📋 Escrow found but not releasable:', anyEscrow.status, anyEscrow.payment_status);

        if (anyEscrow.status === 'released') {
          return Response.json({
            success: false,
            error: 'Funds have already been released for this booking'
          }, { status: 400 });
        }

        return Response.json({
          success: false,
          error: `Cannot release — escrow status is "${anyEscrow.status}", payment status is "${anyEscrow.payment_status}". Payment may not have been completed.`
        }, { status: 400 });
      }

      return Response.json({
        success: false,
        error: 'No payment record found for this booking. The client may not have completed payment yet.'
      }, { status: 404 });
    }

    console.log('💰 Escrow found:', {
      id: escrow.id,
      status: escrow.status,
      gross_amount: escrow.gross_amount,
      net_amount: escrow.net_amount,
      vat_amount: escrow.vat_amount,
      currency: escrow.currency
    });

    // 5. Try release_escrow_funds RPC first, fall back to manual update
    // DB function signature: release_escrow_funds(p_booking_id uuid) RETURNS boolean
    let releaseSuccess = false;

    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('release_escrow_funds', {
        p_booking_id: bookingId
      });

      if (rpcError) throw rpcError;
      if (rpcResult === false) throw new Error('RPC returned false');
      releaseSuccess = true;
      console.log('✅ RPC release successful');

    } catch (rpcErr) {
      console.warn('⚠️ RPC unavailable, using manual release:', rpcErr.message);

      // Manual release — update escrow record directly
      const { error: updateErr } = await supabase
        .from('escrow_transactions')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
          released_by: booking.client_id,
          release_type: 'manual_client',
          updated_at: new Date().toISOString()
        })
        .eq('id', escrow.id);

      if (updateErr) {
        console.error('❌ Manual escrow update failed:', updateErr);
        return Response.json({
          success: false,
          error: 'Failed to release funds',
          details: updateErr.message
        }, { status: 500 });
      }

      // Mark booking funds as released
      await supabase
        .from('bookings')
        .update({
          funds_released_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      releaseSuccess = true;
      console.log('✅ Manual release successful');
    }

    if (!releaseSuccess) {
      return Response.json({ success: false, error: 'Failed to release funds' }, { status: 500 });
    }

    // 6. Non-blocking notifications
    sendReleaseNotifications(escrow, booking).catch(err =>
      console.warn('⚠️ Notification error (non-critical):', err.message)
    );

    // 7. Return success
    const { data: updatedBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    return Response.json({
      success: true,
      message: 'Funds released successfully',
      data: updatedBooking,
      escrowId: escrow.id,
      amount: escrow.net_amount,
      currency: escrow.currency
    });

  } catch (error) {
    console.error('❌ Release API error:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

async function sendReleaseNotifications(escrow, booking) {
  const currency = escrow.currency || booking.currency || 'NGN';
  const netFormatted = formatCurrency(escrow.net_amount, currency);
  const musicianName = `${booking.musician?.first_name || ''} ${booking.musician?.last_name || ''}`.trim();
  const gigTitle = booking.event_type || 'the gig';

  await Promise.allSettled([
    supabase.from('notifications').insert({
      user_id: escrow.musician_id,
      type: 'funds_released',
      title: '🎉 Funds Released!',
      message: `${netFormatted} has been released and is now available for withdrawal. Great job completing "${gigTitle}"!`,
      data: { booking_id: booking.id, escrow_id: escrow.id, amount: escrow.net_amount, currency },
      read: false,
      is_read: false
    }),
    supabase.from('notifications').insert({
      user_id: escrow.client_id,
      type: 'release_confirmed',
      title: '✅ Payment Released',
      message: `You've successfully released ${netFormatted} to ${musicianName}. Thank you for using AmplyGigs!`,
      data: { booking_id: booking.id, escrow_id: escrow.id, amount: escrow.net_amount, currency, musician_name: musicianName },
      read: false,
      is_read: false
    })
  ]);

  console.log('✅ Release notifications sent');
}