// src/app/api/booking/mark-complete/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CURRENCY_SYMBOLS = {
  NGN: '₦', USD: '$', GBP: '£', EUR: '€',
  GHS: '₵', KES: 'KSh', ZAR: 'R',
};

export async function POST(req) {
  try {
    const { bookingId, musicianId } = await req.json();

    if (!bookingId || !musicianId) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Get booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        client:client_id(id, first_name, last_name, email),
        events:event_id(title, event_date)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return Response.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    // 2. Verify ownership
    if (booking.musician_id !== musicianId) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // 3. Must be paid
    if (booking.payment_status !== 'paid') {
      return Response.json(
        { success: false, error: 'Booking must be paid before marking complete' },
        { status: 400 }
      );
    }

    // 4. Event date must have passed
    const eventDate = new Date(booking.events?.event_date || booking.event_date);
    const daysDiff = Math.floor((Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
      return Response.json(
        { success: false, error: 'Cannot mark complete before the event date' },
        { status: 400 }
      );
    }

    // 5. Not already completed
    if (booking.status === 'completed') {
      return Response.json(
        { success: false, error: 'Booking is already marked as complete' },
        { status: 400 }
      );
    }

    // 6. Update booking status
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        marked_complete_at: new Date().toISOString(),
        marked_complete_by: musicianId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError);

      // CHECK CONSTRAINT VIOLATION — status value not in allowed list
      if (updateError.code === '23514') {
        return Response.json(
          {
            success: false,
            error: 'Database constraint error: "completed" is not an allowed status value.',
            fix: `Run this SQL in Supabase:
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('pending','confirmed','completed','cancelled','rejected','disputed','refunded'));`,
            details: updateError.message,
          },
          { status: 500 }
        );
      }

      // COLUMN NOT FOUND — schema cache stale
      if (updateError.code === 'PGRST204') {
        // Retry with minimal payload (just status)
        const { data: retryData, error: retryError } = await supabase
          .from('bookings')
          .update({ status: 'completed' })
          .eq('id', bookingId)
          .select()
          .single();

        if (retryError) {
          return Response.json(
            {
              success: false,
              error: 'Schema mismatch. Some columns may be missing from bookings table.',
              fix: `Run this SQL:
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS marked_complete_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS marked_complete_by UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();`,
              details: retryError.message,
            },
            { status: 500 }
          );
        }

        return await buildSuccessResponse({ booking, updatedBooking: retryData, musicianId, bookingId });
      }

      return Response.json(
        { success: false, error: 'Failed to update booking', details: updateError.message },
        { status: 500 }
      );
    }

    return await buildSuccessResponse({ booking, updatedBooking, musicianId, bookingId });

  } catch (error) {
    console.error('❌ mark-complete error:', error);
    return Response.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

async function buildSuccessResponse({ booking, updatedBooking, musicianId, bookingId }) {
  // Get escrow — maybeSingle() won't throw on empty result
  const { data: escrow } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq('booking_id', bookingId)
    .eq('status', 'held')
    .maybeSingle();

  // Send notifications (non-blocking — don't fail the request if this errors)
  sendNotifications({ booking, musicianId, escrow }).catch(
    (err) => console.warn('⚠️ Notification error (non-fatal):', err.message)
  );

  const autoReleaseAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return Response.json({
    success: true,
    message: 'Gig marked as complete',
    booking: updatedBooking,
    escrow: escrow
      ? {
          id: escrow.id,
          amount: escrow.net_amount,
          currency: escrow.currency || booking.currency || 'NGN',
          status: 'held',
          auto_release_at: autoReleaseAt,
        }
      : null,
    next_steps: {
      message: escrow
        ? 'Client has 24 hours to release funds. After that, funds auto-release to your wallet.'
        : 'Booking marked complete. No escrow record found for this booking.',
      auto_release_in: escrow ? '24 hours' : null,
    },
  });
}

async function sendNotifications({ booking, musicianId, escrow }) {
  const eventTitle = booking.events?.title || 'Your booking';
  const currency = escrow?.currency || booking.currency || 'NGN';
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const amountStr = escrow?.net_amount
    ? `${symbol}${Number(escrow.net_amount).toLocaleString()}`
    : null;

  await Promise.allSettled([
    // Notify client
    supabase.from('notifications').insert({
      user_id: booking.client_id,
      type: 'gig_completed',
      title: '🎉 Gig Completed!',
      message: `The musician has marked "${eventTitle}" as complete. ${amountStr ? `Please release the ${amountStr} payment` : 'Please confirm the booking'} or it will be auto-released in 24 hours.`,
      data: {
        booking_id: booking.id,
        event_title: eventTitle,
        escrow_amount: escrow?.net_amount,
        auto_release_in: '24 hours',
      },
    }),
    // Notify musician
    supabase.from('notifications').insert({
      user_id: musicianId,
      type: 'completion_confirmed',
      title: '✅ Completion Confirmed',
      message: `You marked "${eventTitle}" as complete. ${amountStr ? `Your payment of ${amountStr} will be released within 24 hours.` : 'Payment will be processed shortly.'}`,
      data: {
        booking_id: booking.id,
        event_title: eventTitle,
        escrow_amount: escrow?.net_amount,
        status: 'awaiting_release',
      },
    }),
  ]);
}