// src/app/api/webhook/paystack.js - UPDATED WITH ESCROW INTEGRATION
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📨 Paystack webhook received');

    // 1. Verify Paystack signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      console.error('❌ Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    console.log('📋 Event type:', event.event);

    // 2. Handle successful charge
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      const metadata = event.data.metadata;

      console.log('💳 Processing payment:', { 
        reference, 
        booking_id: metadata?.booking_id 
      });

      // 3. Fetch transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_ref', reference)
        .single();

      if (!transaction) {
        console.error('❌ Transaction not found:', reference);
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Idempotency check
      if (transaction.payment_status === 'successful') {
        console.log('⚠️ Already processed:', reference);
        return res.status(200).json({ message: 'Already processed' });
      }

      // 4. Update transaction
      await supabase
        .from('transactions')
        .update({
          payment_status: 'successful',
          payment_provider: 'paystack',
          metadata: {
            ...transaction.metadata,
            paystack_transaction_id: event.data.id,
            channel: event.data.channel,
            fees: event.data.fees,
            authorization_code: event.data.authorization?.authorization_code,
            card_type: event.data.authorization?.card_type,
            last4: event.data.authorization?.last4,
            bank: event.data.authorization?.bank
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      console.log('✅ Transaction updated');

      // 5. Update booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, musician_id')
        .eq('id', transaction.booking_id)
        .single();

      if (bookingError) {
        console.error('❌ Booking not found:', transaction.booking_id);
        return res.status(404).json({ error: 'Booking not found' });
      }

      await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          payment_reference: reference,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      console.log('✅ Booking updated');

      // ⭐ 6. Add to escrow (UPDATED - replaces credit_musician_ledger)
      console.log('💰 Adding to escrow...');
      
      const { data: escrowData, error: escrowError } = await supabase
        .rpc('add_to_ledger_balance', {
          p_booking_id: transaction.booking_id,
          p_musician_id: booking.musician_id,
          p_client_id: transaction.client_id,
          p_gross_amount: transaction.amount,
          p_platform_fee: transaction.platform_fee || 0,
          p_paystack_reference: reference
        });

      if (escrowError) {
        console.error('❌ Escrow error:', escrowError);
        
        // Update transaction with escrow error
        await supabase
          .from('transactions')
          .update({
            metadata: {
              ...transaction.metadata,
              escrow_error: escrowError.message,
              escrow_failed_at: new Date().toISOString()
            }
          })
          .eq('id', transaction.id);

        // Still return success to Paystack (we got the payment)
        // But log the escrow error for manual resolution
        console.error('⚠️ Payment received but escrow failed - needs manual intervention');
        return res.status(200).json({ 
          success: true, 
          warning: 'Payment received but escrow needs manual processing' 
        });
      }

      console.log('✅ Added to escrow. Transaction ID:', escrowData);

      // Update transaction with escrow info
      await supabase
        .from('transactions')
        .update({
          metadata: {
            ...transaction.metadata,
            escrow_transaction_id: escrowData,
            escrow_added: true,
            escrow_added_at: new Date().toISOString()
          }
        })
        .eq('id', transaction.id);

      // ⭐ 7. Send notifications (optional)
      await sendPaymentNotifications(transaction, booking.id);

      console.log('🎉 Payment processed successfully:', reference);
      return res.status(200).json({ success: true });
    }

    // Handle failed payments
    if (event.event === 'charge.failed') {
      const reference = event.data.reference;
      
      console.log('❌ Payment failed:', reference);
      
      await supabase
        .from('transactions')
        .update({
          payment_status: 'failed',
          metadata: {
            failure_reason: event.data.gateway_response
          }
        })
        .eq('transaction_ref', reference);

      console.log('Transaction marked as failed');
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Paystack webhook error:', err);
    return res.status(500).json({ error: 'Webhook error', details: err.message });
  }
}

// ⭐ Send notifications (optional but recommended)
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

    if (!booking) return;

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

    console.log('✅ Notifications sent');
  } catch (error) {
    console.error('⚠️ Notification error:', error);
    // Don't throw - notifications are not critical
  }
}