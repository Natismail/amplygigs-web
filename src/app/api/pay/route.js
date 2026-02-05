// src/app/api/pay/route.js - REFACTORED FOR WALLET + DUAL PROVIDER
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { 
      amount, 
      email, 
      bookingId, 
      musicianId, 
      clientId,
      countryCode,
      paymentProvider // 'paystack' or 'stripe'
    } = await req.json();

    // Validation
    if (!amount || !email || !bookingId || !musicianId || !clientId) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('💳 Payment request:', { amount, bookingId, provider: paymentProvider });

    // 1. Verify booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, events(*)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return Response.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // 2. Check if payment already completed
    const { data: existingEscrow } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (existingEscrow) {
      return Response.json(
        { success: false, error: 'Payment already completed for this booking' },
        { status: 400 }
      );
    }

    // 3. Determine payment provider based on location
    const provider = paymentProvider || (countryCode === 'NG' ? 'paystack' : 'stripe');
    
    console.log(`🌍 Routing to ${provider} for country: ${countryCode || 'NG'}`);

    // 4. Route to appropriate provider
    if (provider === 'paystack') {
      return await initializePaystack({
        amount,
        email,
        bookingId,
        musicianId,
        clientId,
        booking
      });
    } else if (provider === 'stripe') {
      return await initializeStripe({
        amount,
        email,
        bookingId,
        musicianId,
        clientId,
        booking
      });
    } else {
      return Response.json(
        { success: false, error: 'Invalid payment provider' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Payment API Error:', error);
    return Response.json(
      { success: false, error: 'Payment initialization failed', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================
// PAYSTACK INITIALIZATION
// ============================================

async function initializePaystack({ amount, email, bookingId, musicianId, clientId, booking }) {
  try {
    const txRef = `booking_${bookingId}_${Date.now()}`;
    const amountInKobo = Math.round(amount * 100);

    console.log('🟢 Initializing Paystack payment:', { amount, txRef });

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        reference: txRef,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify?booking_id=${bookingId}&tx_ref=${txRef}&provider=paystack`,
        metadata: {
          booking_id: bookingId,
          musician_id: musicianId,
          client_id: clientId,
          event_title: booking.events?.title,
          custom_fields: [
            {
              display_name: 'Event',
              variable_name: 'event_title',
              value: booking.events?.title || 'Booking'
            }
          ]
        },
        channels: ['card', 'bank', 'ussd', 'bank_transfer']
      })
    });

    const result = await response.json();

    if (result.status) {
      console.log('✅ Paystack initialized:', result.data.reference);

      // Store pending payment (will be created by webhook)
      await supabase.from('pending_payments').insert({
        booking_id: bookingId,
        client_id: clientId,
        musician_id: musicianId,
        amount: amount,
        currency: 'NGN',
        payment_provider: 'paystack',
        payment_reference: txRef,
        status: 'pending',
        metadata: {
          access_code: result.data.access_code,
          authorization_url: result.data.authorization_url
        }
      });

      return Response.json({
        success: true,
        paymentLink: result.data.authorization_url,
        reference: txRef,
        provider: 'paystack'
      });
    } else {
      console.error('❌ Paystack initialization failed:', result.message);
      return Response.json(
        { success: false, error: result.message || 'Payment initialization failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Paystack error:', error);
    throw error;
  }
}

// ============================================
// STRIPE INITIALIZATION
// ============================================

async function initializeStripe({ amount, email, bookingId, musicianId, clientId, booking }) {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const amountInCents = Math.round(amount * 100);

    console.log('🔵 Initializing Stripe payment:', { amount });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: booking.events?.title || 'Musician Booking',
              description: `Booking with ${booking.musician?.first_name || 'musician'}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify?booking_id=${bookingId}&session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment?bookingId=${bookingId}`,
      metadata: {
        booking_id: bookingId,
        musician_id: musicianId,
        client_id: clientId,
        event_title: booking.events?.title
      },
      customer_email: email,
    });

    console.log('✅ Stripe session created:', session.id);

    // Store pending payment
    await supabase.from('pending_payments').insert({
      booking_id: bookingId,
      client_id: clientId,
      musician_id: musicianId,
      amount: amount,
      currency: 'USD',
      payment_provider: 'stripe',
      payment_reference: session.id,
      status: 'pending',
      metadata: {
        session_id: session.id,
        checkout_url: session.url
      }
    });

    return Response.json({
      success: true,
      paymentLink: session.url,
      reference: session.id,
      provider: 'stripe'
    });

  } catch (error) {
    console.error('❌ Stripe error:', error);
    throw error;
  }
}