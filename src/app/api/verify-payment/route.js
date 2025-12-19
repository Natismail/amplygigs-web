// src/app/api/verify-payment/route.js
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

    // 1. Get transaction from database
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_ref', txRef)
      .single();

    if (txError || !transaction) {
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

    // 3. Update transaction as successful
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        payment_status: 'success',
        paid_at: new Date().toISOString(),
        metadata: {
          ...transaction.metadata,
          verification_response: verificationResult.data,
          verified_at: new Date().toISOString()
        }
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Transaction update error:', updateError);
      return Response.json({ error: 'Failed to update transaction' }, { status: 500 });
    }

    // 4. Update booking payment status
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        escrow_amount: transaction.amount,
        escrow_held_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (bookingError) {
      console.error('Booking update error:', bookingError);
    }

    // 5. Credit musician's wallet (in escrow)
    const { error: walletError } = await supabase
      .from('musician_wallets')
      .upsert({
        musician_id: transaction.musician_id,
        balance: 0, // Balance is 0 until funds are released
        escrow_balance: transaction.net_amount,
        total_earnings: transaction.net_amount,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'musician_id',
        ignoreDuplicates: false
      });

    if (walletError) {
      console.error('Wallet update error:', walletError);
    }

    // 6. Send notifications (implement your notification logic)
    await sendPaymentNotifications(transaction, bookingId);

    return Response.json({
      success: true,
      details: {
        amount: transaction.amount,
        reference: txRef,
        provider: provider,
        transactionId: transaction.id
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return Response.json({
      error: 'Verification failed',
      details: error.message
    }, { status: 500 });
  }
}

// Verify Paystack payment
async function verifyPaystack(reference) {
  try {
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
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: false,
        data: result
      };
    }
  } catch (error) {
    console.error('Paystack verification error:', error);
    return { success: false, data: { error: error.message } };
  }
}

// Verify Flutterwave payment
async function verifyFlutterwave(transactionId) {
  try {
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
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: false,
        data: result
      };
    }
  } catch (error) {
    console.error('Flutterwave verification error:', error);
    return { success: false, data: { error: error.message } };
  }
}

// Send notifications
async function sendPaymentNotifications(transaction, bookingId) {
  try {
    // Get booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        musician:musician_id(first_name, last_name, email),
        client:client_id(first_name, last_name, email)
      `)
      .eq('id', bookingId)
      .single();

    if (!booking) return;

    // Notify musician
    await supabase.from('notifications').insert({
      user_id: transaction.musician_id,
      type: 'payment_received',
      title: 'Payment Received!',
      message: `You received ₦${transaction.net_amount.toLocaleString()} for your upcoming gig. Funds are held in escrow.`,
      data: {
        booking_id: bookingId,
        transaction_id: transaction.id,
        amount: transaction.net_amount
      }
    });

    // Notify client
    await supabase.from('notifications').insert({
      user_id: transaction.client_id,
      type: 'payment_success',
      title: 'Payment Successful!',
      message: `Your payment of ₦${transaction.amount.toLocaleString()} was successful. The musician has been notified.`,
      data: {
        booking_id: bookingId,
        transaction_id: transaction.id,
        amount: transaction.amount
      }
    });

    console.log('Notifications sent successfully');
  } catch (error) {
    console.error('Notification error:', error);
  }
}