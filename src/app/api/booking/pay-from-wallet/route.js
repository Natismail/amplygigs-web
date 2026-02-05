// src/app/api/booking/pay-from-wallet/route.js - NEW
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { clientId, bookingId, amount } = await req.json();

    // Validation
    if (!clientId || !bookingId || !amount) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('💰 Wallet payment request:', { clientId, bookingId, amount });

    // 1. Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, musician:musician_id(id, first_name, last_name), events:event_id(title)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return Response.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // 2. Verify booking belongs to client
    if (booking.client_id !== clientId) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 3. Check if already paid
    const { data: existingEscrow } = await supabase
      .from('escrow_transactions')
      .select('id')
      .eq('booking_id', bookingId)
      .single();

    if (existingEscrow) {
      return Response.json(
        { success: false, error: 'Booking already paid' },
        { status: 400 }
      );
    }

    // 4. Pay from wallet using database function
    console.log('📤 Calling client_pay_from_wallet...');
    
    const { data: escrowId, error: paymentError } = await supabase
      .rpc('client_pay_from_wallet', {
        p_client_id: clientId,
        p_booking_id: bookingId,
        p_amount: amount
      });

    if (paymentError) {
      console.error('❌ Wallet payment error:', paymentError);
      
      // Parse error message for user-friendly response
      let errorMessage = 'Wallet payment failed';
      if (paymentError.message?.includes('Insufficient')) {
        errorMessage = 'Insufficient wallet balance';
      } else if (paymentError.message?.includes('not found')) {
        errorMessage = 'Wallet not found. Please add funds first.';
      }

      return Response.json(
        { success: false, error: errorMessage, details: paymentError.message },
        { status: 400 }
      );
    }

    console.log('✅ Wallet payment successful. Escrow ID:', escrowId);

    // 5. Update booking status
    await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        payment_method: 'wallet',
        payment_reference: `wallet_${bookingId}_${Date.now()}`,
        paid_at: new Date().toISOString(),
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // 6. Send notifications
    await sendWalletPaymentNotifications({
      clientId,
      musicianId: booking.musician_id,
      bookingId,
      amount,
      eventTitle: booking.events?.title,
      musicianName: `${booking.musician?.first_name} ${booking.musician?.last_name}`
    });

    // 7. Get updated wallet balance
    const { data: walletBalance } = await supabase
      .rpc('get_client_wallet_balance', { p_client_id: clientId });

    return Response.json({
      success: true,
      message: 'Payment successful',
      escrowId,
      booking: {
        id: bookingId,
        status: 'confirmed',
        payment_status: 'paid'
      },
      wallet: walletBalance?.[0] || null
    });

  } catch (error) {
    console.error('❌ Wallet payment API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Send notifications
async function sendWalletPaymentNotifications({ clientId, musicianId, bookingId, amount, eventTitle, musicianName }) {
  try {
    console.log('📧 Sending wallet payment notifications...');

    // Notify musician
    await supabase.from('notifications').insert({
      user_id: musicianId,
      type: 'payment_received',
      title: '💰 Payment Received!',
      message: `You received a payment of ₦${amount.toLocaleString()} for "${eventTitle}". Funds are held securely in escrow until event completion.`,
      data: {
        booking_id: bookingId,
        amount,
        event_title: eventTitle,
        payment_method: 'wallet'
      }
    });

    // Notify client
    await supabase.from('notifications').insert({
      user_id: clientId,
      type: 'payment_success',
      title: '✅ Payment Successful!',
      message: `Your payment of ₦${amount.toLocaleString()} was successful. ${musicianName} has been notified. Funds will be released after the event.`,
      data: {
        booking_id: bookingId,
        amount,
        musician_name: musicianName,
        event_title: eventTitle,
        payment_method: 'wallet'
      }
    });

    console.log('✅ Notifications sent');
  } catch (error) {
    console.error('⚠️ Notification error:', error);
    // Don't throw - notifications are not critical
  }
}