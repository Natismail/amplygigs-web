// src/app/api/release-funds/route.js
// RELEASE ESCROW FUNDS API - Updated to work with existing component

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return Response.json({ 
        success: false,
        error: 'Booking ID is required' 
      }, { status: 400 });
    }

    console.log('📤 Release request for booking:', bookingId);

    // 1. Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        event:event_id(title),
        musician:musician_id(id, first_name, last_name, email),
        client:client_id(id, first_name, last_name, email)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('❌ Booking not found:', bookingError);
      return Response.json({ 
        success: false,
        error: 'Booking not found' 
      }, { status: 404 });
    }

    // 2. Verify booking is completed or event date has passed
    const eventDate = new Date(booking.event_date);
    const now = new Date();
    const isEventPassed = eventDate < now;

    if (booking.status !== 'completed' && !isEventPassed) {
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

    // 4. Find escrow transaction
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('status', 'held')
      .single();

    if (escrowError || !escrow) {
      console.error('❌ No escrow found:', escrowError);
      return Response.json({ 
        success: false,
        error: 'No funds in escrow for this booking' 
      }, { status: 404 });
    }

    console.log('💰 Found escrow:', {
      id: escrow.id,
      amount: escrow.net_amount,
      musician: booking.musician?.first_name
    });

    // 5. Release funds using database function
    // We use the client_id from the booking as the releaser
    const { data: result, error: releaseError } = await supabase
      .rpc('release_escrow_funds', {
        p_escrow_id: escrow.id,
        p_released_by: booking.client_id,
        p_release_type: 'manual_client'
      });

    if (releaseError) {
      console.error('❌ Release error:', releaseError);
      return Response.json({ 
        success: false,
        error: 'Failed to release funds',
        details: releaseError.message 
      }, { status: 500 });
    }

    console.log('✅ Funds released successfully');

    // 6. Send notifications
    await sendReleaseNotifications(escrow, booking);

    // 7. Return success with updated booking data
    const { data: updatedBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

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

// Send notifications to both parties
async function sendReleaseNotifications(escrow, booking) {
  try {
    const currencySymbol = escrow.currency === 'NGN' ? '₦' : '$';

    // Notify musician
    await supabase.from('notifications').insert({
      user_id: escrow.musician_id,
      type: 'funds_released',
      title: '🎉 Funds Released!',
      message: `${currencySymbol}${escrow.net_amount.toLocaleString()} has been released and is now available for withdrawal. Great job on completing "${booking.event?.title || 'the gig'}"!`,
      data: {
        booking_id: booking.id,
        escrow_id: escrow.id,
        amount: escrow.net_amount,
        currency: escrow.currency,
        event_title: booking.event?.title
      }
    });

    // Notify client
    await supabase.from('notifications').insert({
      user_id: escrow.client_id,
      type: 'release_confirmed',
      title: '✅ Payment Released',
      message: `You've successfully released ${currencySymbol}${escrow.net_amount.toLocaleString()} to ${booking.musician?.first_name} ${booking.musician?.last_name}. Thank you for using AmplyGigs!`,
      data: {
        booking_id: booking.id,
        escrow_id: escrow.id,
        amount: escrow.net_amount,
        currency: escrow.currency,
        event_title: booking.event?.title,
        musician_name: `${booking.musician?.first_name} ${booking.musician?.last_name}`
      }
    });

    console.log('✅ Release notifications sent');
  } catch (error) {
    console.error('⚠️ Notification error:', error);
    // Don't throw - notifications are not critical
  }
}