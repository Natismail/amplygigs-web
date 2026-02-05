// src/app/api/booking/mark-complete/route.js - NEW
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { bookingId, musicianId } = await req.json();

    // Validation
    if (!bookingId || !musicianId) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('✅ Mark complete request:', { bookingId, musicianId });

    // 1. Get booking details
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
      return Response.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // 2. Verify musician owns this booking
    if (booking.musician_id !== musicianId) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 3. Check booking is paid
    if (booking.payment_status !== 'paid') {
      return Response.json(
        { success: false, error: 'Booking must be paid before marking complete' },
        { status: 400 }
      );
    }

    // 4. Check event date has passed or is today
    const eventDate = new Date(booking.events?.event_date || booking.event_date);
    const now = new Date();
    const daysDifference = Math.floor((now - eventDate) / (1000 * 60 * 60 * 24));

    if (daysDifference < 0) {
      return Response.json(
        { success: false, error: 'Cannot mark complete before event date' },
        { status: 400 }
      );
    }

    // 5. Check if already marked complete
    if (booking.status === 'completed' && booking.marked_complete_at) {
      return Response.json(
        { success: false, error: 'Booking already marked as complete' },
        { status: 400 }
      );
    }

    // 6. Update booking to completed
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        marked_complete_at: new Date().toISOString(),
        marked_complete_by: musicianId,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return Response.json(
        { success: false, error: 'Failed to mark booking as complete' },
        { status: 500 }
      );
    }

    console.log('✅ Booking marked complete');

    // 7. Get escrow details
    const { data: escrow } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('status', 'held')
      .single();

    // 8. Send notifications
    await sendCompletionNotifications({
      booking,
      musicianId,
      escrow
    });

    // 9. Return success with auto-release info
    const autoReleaseAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    return Response.json({
      success: true,
      message: 'Gig marked as complete',
      booking: updatedBooking,
      escrow: escrow ? {
        id: escrow.id,
        amount: escrow.net_amount,
        currency: escrow.currency,
        status: 'held',
        auto_release_at: autoReleaseAt.toISOString()
      } : null,
      next_steps: {
        message: 'Client has 24 hours to release funds. After that, funds will be auto-released.',
        auto_release_in: '24 hours'
      }
    });

  } catch (error) {
    console.error('❌ Mark complete API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Send completion notifications
async function sendCompletionNotifications({ booking, musicianId, escrow }) {
  try {
    console.log('📧 Sending completion notifications...');

    const eventTitle = booking.events?.title || 'Your booking';
    const currencySymbol = escrow?.currency === 'NGN' ? '₦' : '$';

    // Notify client
    await supabase.from('notifications').insert({
      user_id: booking.client_id,
      type: 'gig_completed',
      title: '🎉 Gig Completed!',
      message: `The musician has marked "${eventTitle}" as complete. Please release the funds or they will be auto-released in 24 hours.`,
      data: {
        booking_id: booking.id,
        event_title: eventTitle,
        escrow_amount: escrow?.net_amount,
        auto_release_in: '24 hours'
      }
    });

    // Notify musician
    const amountMessage = escrow 
      ? `Your payment of ${currencySymbol}${escrow.net_amount.toLocaleString()} will be released within 24 hours.`
      : 'Payment will be processed shortly.';

    await supabase.from('notifications').insert({
      user_id: musicianId,
      type: 'completion_confirmed',
      title: '✅ Completion Confirmed',
      message: `You marked "${eventTitle}" as complete. ${amountMessage}`,
      data: {
        booking_id: booking.id,
        event_title: eventTitle,
        escrow_amount: escrow?.net_amount,
        status: 'awaiting_release'
      }
    });

    console.log('✅ Completion notifications sent');
  } catch (error) {
    console.error('⚠️ Notification error:', error);
  }
}