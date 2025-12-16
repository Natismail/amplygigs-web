// src/app/api/pay/route.js
//import Flutterwave from 'flutterwave-node-v3';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for server-side
);

export async function POST(req) {
  try {
    const { amount, email, currency, bookingId, musicianId } = await req.json();

    // Validate required fields
    if (!amount || !email || !bookingId || !musicianId) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    const flw = new Flutterwave(
      process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      flutterwaveSecretKey
    );

    // 1. Verify booking exists and is in correct status
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, events(*)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return Response.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // 2. Check if payment already exists for this booking
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('payment_status', 'successful')
      .single();

    if (existingTransaction) {
      return Response.json(
        { error: 'Payment already completed for this booking' },
        { status: 400 }
      );
    }

    // 3. Calculate platform fee (10%)
    const platformFee = amount * 0.10;
    const musicianNetAmount = amount - platformFee;

    // 4. Create transaction record in pending state
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
        currency: currency || 'NGN',
        transaction_ref: txRef,
        payment_status: 'pending',
        payment_provider: 'flutterwave',
        description: `Payment for ${booking.events?.title || 'gig'}`,
        metadata: {
          booking_id: bookingId,
          event_name: booking.events?.title
        }
      })
      .select()
      .single();

    if (txError) {
      console.error('Transaction creation error:', txError);
      return Response.json(
        { error: 'Failed to create transaction record' },
        { status: 500 }
      );
    }

    // 5. Initialize Flutterwave payment
    const payload = {
      tx_ref: txRef,
      amount: amount,
      currency: currency || 'NGN',
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify?booking_id=${bookingId}&tx_ref=${txRef}`,
      customer: {
        email: email,
        name: booking.client_name || email
      },
      customizations: {
        title: 'AmplyGigs Payment',
        description: `Payment for ${booking.events?.title || 'gig'}`,
        logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`
      },
      meta: {
        booking_id: bookingId,
        transaction_id: transaction.id,
        musician_id: musicianId
      }
    };

    const response = await flw.Charge.card(payload);

    if (response.status === 'success') {
      // Update transaction with payment link
      await supabase
        .from('transactions')
        .update({
          metadata: {
            ...transaction.metadata,
            payment_link: response.data.link
          }
        })
        .eq('id', transaction.id);

      return Response.json({
        success: true,
        paymentLink: response.data.link,
        transactionId: transaction.id,
        txRef: txRef
      });
    } else {
      // Update transaction as failed
      await supabase
        .from('transactions')
        .update({ payment_status: 'failed' })
        .eq('id', transaction.id);

      return Response.json(
        { error: response.message || 'Payment initiation failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment API Error:', error);
    return Response.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}