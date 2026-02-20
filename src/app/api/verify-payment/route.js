// src/app/api/verify-payment/route.js - UPDATED WITH ESCROW INTEGRATION
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { txRef, bookingId, provider, reference } = await req.json();

    if (!txRef || !bookingId || !provider) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('🔍 Verifying payment:', { txRef, bookingId, provider });

    // 1. Get transaction from database
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_ref', txRef)
      .single();

    if (txError || !transaction) {
      console.error('❌ Transaction not found:', txRef);
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // 2. Verify with payment provider
    let verificationResult;
    if (provider === 'paystack') {
      verificationResult = await verifyPaystack(reference || txRef);
    } else if (provider === 'flutterwave') {
      verificationResult = await verifyFlutterwave(reference || txRef);
    } else {
      return Response.json({ error: 'Invalid payment provider' }, { status: 400 });
    }

    if (!verificationResult.success) {
      console.log('❌ Payment verification failed');
      
      // Update transaction as failed
      await supabase
        .from('transactions')
        .update({
          payment_status: 'failed',
          metadata: {
            ...transaction.metadata,
            verification_response: verificationResult.data,
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', transaction.id);

      return Response.json({
        success: false,
        error: 'Payment verification failed'
      });
    }

    console.log('✅ Payment verified successfully');

    // 3. Update transaction as successful
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        payment_status: 'successful',
        paid_at: new Date().toISOString(),
        metadata: {
          ...transaction.metadata,
          verification_response: verificationResult.data,
          verified_at: new Date().toISOString()
        }
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('❌ Transaction update error:', updateError);
      return Response.json({ error: 'Failed to update transaction' }, { status: 500 });
    }

    // 4. Update booking payment status
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        payment_reference: reference || txRef,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (bookingError) {
      console.error('⚠️ Booking update error:', bookingError);
    }

    // ⭐ 5. Add to escrow (UPDATED - replaces direct wallet upsert)
    console.log('💰 Adding to escrow...');
    
    const { data: escrowData, error: escrowError } = await supabase
      .rpc('add_to_ledger_balance', {
        p_booking_id: bookingId,
        p_musician_id: transaction.musician_id,
        p_client_id: transaction.client_id,
        p_gross_amount: transaction.amount,
        p_platform_fee: transaction.platform_fee || 0,
        p_paystack_reference: reference || txRef
      });

    if (escrowError) {
      console.error('⚠️ Escrow error:', escrowError);
      
      // Log the error but don't fail the verification
      // Webhook will be the primary source of escrow updates
      await supabase
        .from('transactions')
        .update({
          metadata: {
            ...transaction.metadata,
            escrow_error: escrowError.message,
            escrow_error_note: 'Manual verification - webhook is primary escrow trigger'
          }
        })
        .eq('id', transaction.id);
    } else {
      console.log('✅ Added to escrow. Transaction ID:', escrowData);
      
      // Update transaction with escrow info
      await supabase
        .from('transactions')
        .update({
          metadata: {
            ...transaction.metadata,
            escrow_transaction_id: escrowData,
            escrow_added_via: 'verification',
            escrow_added_at: new Date().toISOString()
          }
        })
        .eq('id', transaction.id);
    }

    // 6. Send notifications
    await sendPaymentNotifications(transaction, bookingId);

    console.log('🎉 Payment verification complete');

    return Response.json({
      success: true,
      details: {
        amount: transaction.amount,
        reference: txRef,
        provider: provider,
        transactionId: transaction.id,
        escrowAdded: !escrowError
      }
    });

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    return Response.json({
      error: 'Verification failed',
      details: error.message
    }, { status: 500 });
  }
}

// Verify Paystack payment
async function verifyPaystack(reference) {
  try {
    console.log('🔍 Verifying with Paystack:', reference);
    
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (result.status && result.data.status === 'success') {
      console.log('✅ Paystack verification successful');
      return {
        success: true,
        data: result.data
      };
    } else {
      console.log('❌ Paystack verification failed:', result.message);
      return {
        success: false,
        data: result
      };
    }
  } catch (error) {
    console.error('❌ Paystack verification error:', error);
    return { success: false, data: { error: error.message } };
  }
}

// Verify Flutterwave payment
async function verifyFlutterwave(transactionId) {
  try {
    console.log('🔍 Verifying with Flutterwave:', transactionId);
    
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (result.status === 'success' && result.data.status === 'successful') {
      console.log('✅ Flutterwave verification successful');
      return {
        success: true,
        data: result.data
      };
    } else {
      console.log('❌ Flutterwave verification failed:', result.message);
      return {
        success: false,
        data: result
      };
    }
  } catch (error) {
    console.error('❌ Flutterwave verification error:', error);
    return { success: false, data: { error: error.message } };
  }
}

// Send notifications
async function sendPaymentNotifications(transaction, bookingId) {
  try {
    console.log('📧 Sending notifications...');

    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        musician:musician_id(first_name, last_name, email),
        client:client_id(first_name, last_name, email),
        events:event_id(title)
      `)
      .eq('id', bookingId)
      .single();

    if (!booking) {
      console.log('⚠️ Booking not found for notifications');
      return;
    }

    // Notify musician
    await supabase.from('notifications').insert({
      user_id: transaction.musician_id,
      type: 'payment_received',
      title: 'Payment Received! 💰',
      message: `You received ₦${transaction.net_amount.toLocaleString()} for ${booking.events?.title || 'your upcoming gig'}. Funds are held in escrow until the event is completed.`,
      data: {
        booking_id: bookingId,
        transaction_id: transaction.id,
        amount: transaction.net_amount,
        event_title: booking.events?.title
      }
    });

    // Notify client
    await supabase.from('notifications').insert({
      user_id: transaction.client_id,
      type: 'payment_success',
      title: 'Payment Successful! ✅',
      message: `Your payment of ₦${transaction.amount.toLocaleString()} was successful. ${booking.musician?.first_name} ${booking.musician?.last_name} has been notified.`,
      data: {
        booking_id: bookingId,
        transaction_id: transaction.id,
        amount: transaction.amount,
        musician_name: `${booking.musician?.first_name} ${booking.musician?.last_name}`,
        event_title: booking.events?.title
      }
    });

    console.log('✅ Notifications sent successfully');
  } catch (error) {
    console.error('⚠️ Notification error:', error);
    // Don't throw - notifications are not critical
  }

}
