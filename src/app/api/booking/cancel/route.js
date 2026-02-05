// src/app/api/booking/cancel/route.js - NEW
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { bookingId, userId, role, reason, category } = await req.json();

    // Validation
    if (!bookingId || !userId || !role) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('❌ Cancellation request:', { bookingId, role, reason });

    // 1. Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        musician:musician_id(id, first_name, last_name, email),
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

    // 2. Verify authorization
    if (role === 'CLIENT' && booking.client_id !== userId) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (role === 'MUSICIAN' && booking.musician_id !== userId) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 3. Check if already cancelled
    if (booking.status === 'cancelled') {
      return Response.json(
        { success: false, error: 'Booking already cancelled' },
        { status: 400 }
      );
    }

    // 4. Call cancellation function with compliance tracking
    console.log('📞 Calling cancel_booking_with_compliance...');

    const { data: cancellationId, error: cancelError } = await supabase
      .rpc('cancel_booking_with_compliance', {
        p_booking_id: bookingId,
        p_cancelled_by: userId,
        p_cancelled_by_role: role,
        p_reason: reason || 'Cancellation requested',
        p_cancellation_category: category || (role === 'CLIENT' ? 'client_request' : 'musician_request')
      });

    if (cancelError) {
      console.error('❌ Cancellation error:', cancelError);
      return Response.json(
        { success: false, error: 'Cancellation failed', details: cancelError.message },
        { status: 500 }
      );
    }

    console.log('✅ Booking cancelled. Cancellation ID:', cancellationId);

    // 5. Get cancellation details
    const { data: cancellation } = await supabase
      .from('booking_cancellations')
      .select('*')
      .eq('id', cancellationId)
      .single();

    // 6. Send cancellation notifications
    await sendCancellationNotifications({
      booking,
      cancellation,
      cancelledByRole: role
    });

    // 7. Get updated booking
    const { data: updatedBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    return Response.json({
      success: true,
      message: 'Booking cancelled successfully',
      cancellation: {
        id: cancellationId,
        is_late_cancellation: cancellation?.is_late_cancellation,
        penalty_applied: cancellation?.penalty_applied,
        refund_issued: cancellation?.refund_issued,
        refund_amount: cancellation?.refund_amount
      },
      booking: updatedBooking
    });

  } catch (error) {
    console.error('❌ Cancel booking API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Send cancellation notifications
async function sendCancellationNotifications({ booking, cancellation, cancelledByRole }) {
  try {
    console.log('📧 Sending cancellation notifications...');

    const eventTitle = booking.events?.title || 'Your booking';
    const musicianName = `${booking.musician?.first_name} ${booking.musician?.last_name}`;
    const clientName = `${booking.client?.first_name} ${booking.client?.last_name}`;

    // Notify musician
    if (cancelledByRole === 'CLIENT') {
      await supabase.from('notifications').insert({
        user_id: booking.musician_id,
        type: 'booking_cancelled',
        title: '❌ Booking Cancelled',
        message: `${clientName} cancelled the booking for "${eventTitle}". ${cancellation?.refund_issued ? 'Payment has been refunded to their wallet.' : 'No payment was made.'}`,
        data: {
          booking_id: booking.id,
          event_title: eventTitle,
          cancelled_by: 'client',
          cancellation_id: cancellation?.id
        }
      });
    } else {
      await supabase.from('notifications').insert({
        user_id: booking.musician_id,
        type: 'cancellation_confirmed',
        title: '✅ Cancellation Confirmed',
        message: `You cancelled the booking for "${eventTitle}". ${cancellation?.is_late_cancellation ? '⚠️ This was a late cancellation and has been recorded.' : ''}`,
        data: {
          booking_id: booking.id,
          event_title: eventTitle,
          is_late_cancellation: cancellation?.is_late_cancellation,
          cancellation_id: cancellation?.id
        }
      });
    }

    // Notify client
    if (cancelledByRole === 'MUSICIAN') {
      const refundMessage = cancellation?.refund_issued 
        ? `Payment of ₦${cancellation.refund_amount?.toLocaleString()} has been refunded to your wallet.`
        : 'No payment was made.';

      await supabase.from('notifications').insert({
        user_id: booking.client_id,
        type: 'booking_cancelled',
        title: '❌ Booking Cancelled',
        message: `${musicianName} cancelled your booking for "${eventTitle}". ${refundMessage}`,
        data: {
          booking_id: booking.id,
          event_title: eventTitle,
          musician_name: musicianName,
          cancelled_by: 'musician',
          refund_amount: cancellation?.refund_amount,
          cancellation_id: cancellation?.id
        }
      });
    } else {
      const refundMessage = cancellation?.refund_issued
        ? `Your payment of ₦${cancellation.refund_amount?.toLocaleString()} has been refunded to your wallet.`
        : '';

      await supabase.from('notifications').insert({
        user_id: booking.client_id,
        type: 'cancellation_confirmed',
        title: '✅ Cancellation Confirmed',
        message: `You cancelled the booking for "${eventTitle}" with ${musicianName}. ${refundMessage}`,
        data: {
          booking_id: booking.id,
          event_title: eventTitle,
          musician_name: musicianName,
          refund_amount: cancellation?.refund_amount,
          cancellation_id: cancellation?.id
        }
      });
    }

    // Send late cancellation warning to musician if applicable
    if (cancelledByRole === 'MUSICIAN' && cancellation?.is_late_cancellation) {
      await supabase.from('notifications').insert({
        user_id: booking.musician_id,
        type: 'compliance_warning',
        title: '⚠️ Late Cancellation Warning',
        message: `Your cancellation of "${eventTitle}" was less than 24 hours before the event. This has been recorded in your compliance history. Multiple late cancellations may result in suspension.`,
        data: {
          booking_id: booking.id,
          event_title: eventTitle,
          violation_type: 'late_cancellation',
          cancellation_id: cancellation?.id
        }
      });
    }

    console.log('✅ Cancellation notifications sent');
  } catch (error) {
    console.error('⚠️ Notification error:', error);
    // Don't throw - notifications are not critical
  }
}