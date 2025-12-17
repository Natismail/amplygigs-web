// src/app/api/pay-paystack/route.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLATFORM_FEE_PERCENTAGE = 0.05; // 5% platform fee

export async function POST(req) {
  try {
    const { amount, email, bookingId, musicianId, paymentProvider = 'paystack' } = await req.json();

    if (!amount || !email || !bookingId || !musicianId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, events(*)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 2. Calculate fees
    const platformFee = amount * PLATFORM_FEE_PERCENTAGE;
    const musicianNetAmount = amount - platformFee;

    // 3. Create transaction record
    const txRef = `amply_${bookingId}_${Date.now()}`;
    
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        booking_id: bookingId,
        musician_id: musicianId,
        client_id: booking.client_id,
        transaction_type: 'payment',
        amount: amount,
        platform_fee: platformFee,
        net_amount: musicianNetAmount,
        currency: 'NGN',
        transaction_ref: txRef,
        payment_status: 'pending',
        payment_provider: paymentProvider,
        description: `Payment for ${booking.events?.title || 'gig'}`,
        metadata: {
          booking_id: bookingId,
          event_name: booking.events?.title,
          platform_fee_percentage: PLATFORM_FEE_PERCENTAGE
        }
      })
      .select()
      .single();

    if (txError) {
      console.error('Transaction creation error:', txError);
      return Response.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    // 4. Initialize payment based on provider
    if (paymentProvider === 'paystack') {
      return await initializePaystack(transaction, email, amount, txRef, bookingId);
    } else if (paymentProvider === 'flutterwave') {
      return await initializeFlutterwave(transaction, email, amount, txRef, bookingId);
    } else {
      return Response.json({ error: 'Invalid payment provider' }, { status: 400 });
    }

  } catch (error) {
    console.error('Payment API Error:', error);
    return Response.json({ error: 'Unexpected error', details: error.message }, { status: 500 });
  }
}

// Paystack initialization
async function initializePaystack(transaction, email, amount, txRef, bookingId) {
  try {
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: amount * 100, // Paystack uses kobo (multiply by 100)
        reference: txRef,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify?booking_id=${bookingId}&tx_ref=${txRef}&provider=paystack`,
        metadata: {
          booking_id: bookingId,
          transaction_id: transaction.id,
          custom_fields: [
            {
              display_name: "Booking ID",
              variable_name: "booking_id",
              value: bookingId
            }
          ]
        },
        channels: ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer']
      })
    });

    const result = await paystackResponse.json();

    if (result.status) {
      // Update transaction with Paystack reference
      await supabase
        .from('transactions')
        .update({
          metadata: {
            ...transaction.metadata,
            paystack_reference: result.data.reference,
            payment_link: result.data.authorization_url
          }
        })
        .eq('id', transaction.id);

      return Response.json({
        success: true,
        paymentLink: result.data.authorization_url,
        transactionId: transaction.id,
        txRef: txRef,
        provider: 'paystack',
        platformFee: transaction.platform_fee,
        platformFeePercentage: PLATFORM_FEE_PERCENTAGE * 100 // Return as percentage
      });
    } else {
      throw new Error(result.message || 'Paystack initialization failed');
    }
  } catch (error) {
    console.error('Paystack error:', error);
    
    // Fallback to Flutterwave if Paystack fails
    console.log('Falling back to Flutterwave...');
    return await initializeFlutterwave(transaction, email, amount, txRef, bookingId);
  }
}

// Flutterwave initialization (fallback)
async function initializeFlutterwave(transaction, email, amount, txRef, bookingId) {
  try {
    const Flutterwave = (await import('flutterwave-node-v3')).default;
    const flw = new Flutterwave(
      process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      process.env.FLUTTERWAVE_SECRET_KEY
    );

    const payload = {
      tx_ref: txRef,
      amount: amount,
      currency: 'NGN',
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify?booking_id=${bookingId}&tx_ref=${txRef}&provider=flutterwave`,
      customer: {
        email: email,
        name: email
      },
      customizations: {
        title: 'AmplyGigs Payment',
        description: `Payment for booking ${bookingId}`,
        logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`
      },
      meta: {
        booking_id: bookingId,
        transaction_id: transaction.id
      }
    };

    const response = await flw.Charge.card(payload);

    if (response.status === 'success') {
      await supabase
        .from('transactions')
        .update({
          metadata: {
            ...transaction.metadata,
            flutterwave_reference: response.data.id,
            payment_link: response.data.link
          }
        })
        .eq('id', transaction.id);

      return Response.json({
        success: true,
        paymentLink: response.data.link,
        transactionId: transaction.id,
        txRef: txRef,
        provider: 'flutterwave',
        platformFee: transaction.platform_fee,
        platformFeePercentage: PLATFORM_FEE_PERCENTAGE * 100
      });
    } else {
      throw new Error('Both payment providers failed');
    }
  } catch (error) {
    console.error('Flutterwave error:', error);
    
    await supabase
      .from('transactions')
      .update({ payment_status: 'failed' })
      .eq('id', transaction.id);

    return Response.json(
      { error: 'All payment providers failed', details: error.message },
      { status: 500 }
    );
  }
}