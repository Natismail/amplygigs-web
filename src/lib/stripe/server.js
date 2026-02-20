import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Create Stripe payment intent for ticket purchase
 */
export async function createTicketPaymentIntent(amount, currency, metadata) {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: currency || 'usd',
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession({
  amount,
  currency = 'usd',
  purchaseId,
  eventTitle,
  customerEmail,
  successUrl,
  cancelUrl,
}) {
  return await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `Tickets for ${eventTitle}`,
            description: 'Event tickets purchased on AmplyGigs',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    metadata: {
      purchase_id: purchaseId,
      platform: 'amplygigs',
    },
  });
}

/**
 * Verify Stripe webhook signature
 */
export function verifyStripeWebhook(payload, signature) {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
}