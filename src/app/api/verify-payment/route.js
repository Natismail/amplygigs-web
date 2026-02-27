// src/app/api/verify-payment/route.js - SUPPORTS BOTH PAYSTACK & STRIPE
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { txRef, bookingId, provider, reference } = body;

    console.log('🔍 Verification request:', { txRef, bookingId, provider, reference });

    // Validate inputs
    if (!bookingId) {
      console.error('❌ Missing booking ID');
      return Response.json(
        { success: false, error: 'Missing booking ID' },
        { status: 400 }
      );
    }

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('❌ Booking not found:', bookingId, bookingError);
      return Response.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if already paid
    if (booking.payment_status === 'paid') {
      console.log('✅ Already paid');
      return Response.json({
        success: true,
        message: 'Payment already confirmed',
        details: {
          amount: booking.amount,
          reference: txRef || reference,
          provider: provider || 'paystack'
        }
      });
    }

    // Verify payment based on provider
    const paymentRef = reference || txRef;
    if (!paymentRef) {
      console.error('❌ Missing payment reference');
      return Response.json(
        { success: false, error: 'Missing payment reference' },
        { status: 400 }
      );
    }

    let verificationResult;
    
    // ⭐ ENHANCED: Support both Paystack and Stripe
    if (provider === 'stripe') {
      console.log('🔵 Verifying with Stripe:', paymentRef);
      verificationResult = await verifyStripe(paymentRef);
    } else {
      // Default to Paystack
      console.log('🟢 Verifying with Paystack:', paymentRef);
      verificationResult = await verifyPaystack(paymentRef);
    }

    if (!verificationResult.success) {
      console.error('❌ Payment verification failed');
      return Response.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    console.log('✅ Payment verified');

    // Update booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        payment_reference: paymentRef,
        paid_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('❌ Failed to update booking:', updateError);
      return Response.json(
        { success: false, error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    // Create escrow
    const { error: escrowError } = await supabase
      .from('escrow_transactions')
      .insert({
        booking_id: bookingId,
        amount: booking.amount,
        status: 'held',
        payment_reference: paymentRef,
        payment_provider: provider || 'paystack',
      });

    if (escrowError) {
      console.error('⚠️ Escrow error:', escrowError);
    }

    // Create transaction
    const platformFee = booking.amount * 0.10;
    const netAmount = booking.amount - platformFee;

    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        booking_id: bookingId,
        musician_id: booking.musician_id,
        client_id: booking.client_id,
        transaction_type: 'payment',
        gross_amount: booking.amount,
        net_amount: netAmount,
        platform_fee: platformFee,
        payment_status: 'successful',
        payment_method: provider || 'paystack',
        description: `Payment for booking ${bookingId}`,
        transaction_ref: paymentRef,
      });

    if (txError) {
      console.error('⚠️ Transaction record error:', txError);
    }

    console.log('🎉 Verification complete');

    return Response.json({
      success: true,
      details: {
        amount: booking.amount,
        reference: paymentRef,
        provider: provider || 'paystack'
      }
    });

  } catch (error) {
    console.error('❌ Verification error:', error);
    return Response.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}

// ⭐ Verify Paystack payment
async function verifyPaystack(reference) {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return { success: false, data: null };
    }

    const result = await response.json();

    if (result.status && result.data.status === 'success') {
      return { success: true, data: result.data };
    }

    return { success: false, data: result };
  } catch (error) {
    console.error('Paystack verification error:', error);
    return { success: false, data: null };
  }
}

// ⭐ Verify Stripe payment
async function verifyStripe(sessionId) {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      return { success: true, data: session };
    }

    return { success: false, data: session };
  } catch (error) {
    console.error('Stripe verification error:', error);
    return { success: false, data: null };
  }
}