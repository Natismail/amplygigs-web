// src/app/api/webhook/paystack-transfer/route.js
// PAYSTACK TRANSFER WEBHOOK - Handle withdrawal confirmations

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    // 1. Verify Paystack signature
    const body = await req.text();
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex');

    const paystackSignature = req.headers.get('x-paystack-signature');

    if (hash !== paystackSignature) {
      console.error('❌ Invalid webhook signature');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('📨 Paystack transfer webhook:', event.event);

    // 2. Handle different event types
    switch (event.event) {
      case 'transfer.success':
        await handleTransferSuccess(event.data);
        break;
      
      case 'transfer.failed':
        await handleTransferFailed(event.data);
        break;
      
      case 'transfer.reversed':
        await handleTransferReversed(event.data);
        break;
      
      default:
        console.log(`⚠️ Unhandled event type: ${event.event}`);
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// Handle successful transfer
async function handleTransferSuccess(data) {
  try {
    console.log('✅ Transfer successful:', data.transfer_code);

    // Find withdrawal by transfer_code or reference
    const { data: withdrawal, error: findError } = await supabase
      .from('withdrawals')
      .select('*')
      .or(`transfer_code.eq.${data.transfer_code},transfer_reference.eq.${data.reference}`)
      .single();

    if (findError || !withdrawal) {
      console.error('❌ Withdrawal not found:', data.transfer_code);
      return;
    }

    // Update withdrawal to completed
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
        provider_status: 'success',
        metadata: {
          ...withdrawal.metadata,
          paystack_success_data: data,
          completed_via: 'webhook'
        }
      })
      .eq('id', withdrawal.id);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return;
    }

    // Update wallet balances
    await supabase
      .from('musician_wallets')
      .update({
        pending_withdrawals: supabase.rpc('greatest', [0, supabase.raw(`pending_withdrawals - ${withdrawal.amount}`)]),
        total_withdrawn: supabase.raw(`total_withdrawn + ${withdrawal.amount}`)
      })
      .eq('musician_id', withdrawal.musician_id);

    // Send success notification
    await supabase.from('notifications').insert({
      user_id: withdrawal.musician_id,
      type: 'withdrawal_completed',
      title: '✅ Withdrawal Successful!',
      message: `₦${withdrawal.amount.toLocaleString()} has been sent to your bank account. It should arrive within 24 hours.`,
      data: {
        withdrawal_id: withdrawal.id,
        amount: withdrawal.amount,
        transfer_code: data.transfer_code,
        recipient_name: data.recipient?.name
      }
    });

    console.log(`✅ Withdrawal ${withdrawal.id} completed successfully`);

  } catch (error) {
    console.error('❌ handleTransferSuccess error:', error);
  }
}

// Handle failed transfer
async function handleTransferFailed(data) {
  try {
    console.log('❌ Transfer failed:', data.transfer_code);

    // Find withdrawal
    const { data: withdrawal, error: findError } = await supabase
      .from('withdrawals')
      .select('*')
      .or(`transfer_code.eq.${data.transfer_code},transfer_reference.eq.${data.reference}`)
      .single();

    if (findError || !withdrawal) {
      console.error('❌ Withdrawal not found:', data.transfer_code);
      return;
    }

    // Update withdrawal to failed
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        failure_reason: data.reason || 'Transfer failed',
        failure_code: data.code,
        provider_status: 'failed',
        retry_count: withdrawal.retry_count + 1,
        metadata: {
          ...withdrawal.metadata,
          paystack_failure_data: data,
          failed_via: 'webhook'
        }
      })
      .eq('id', withdrawal.id);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return;
    }

    // Return funds to available balance
    await supabase
      .from('musician_wallets')
      .update({
        available_balance: supabase.raw(`available_balance + ${withdrawal.amount}`),
        pending_withdrawals: supabase.rpc('greatest', [0, supabase.raw(`pending_withdrawals - ${withdrawal.amount}`)])
      })
      .eq('musician_id', withdrawal.musician_id);

    // Send failure notification
    await supabase.from('notifications').insert({
      user_id: withdrawal.musician_id,
      type: 'withdrawal_failed',
      title: '❌ Withdrawal Failed',
      message: `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} failed: ${data.reason || 'Unknown error'}. Funds have been returned to your available balance. Please try again or contact support.`,
      data: {
        withdrawal_id: withdrawal.id,
        amount: withdrawal.amount,
        reason: data.reason,
        code: data.code
      }
    });

    console.log(`❌ Withdrawal ${withdrawal.id} failed: ${data.reason}`);

  } catch (error) {
    console.error('❌ handleTransferFailed error:', error);
  }
}

// Handle reversed transfer
async function handleTransferReversed(data) {
  try {
    console.log('🔄 Transfer reversed:', data.transfer_code);

    // Find withdrawal
    const { data: withdrawal, error: findError } = await supabase
      .from('withdrawals')
      .select('*')
      .or(`transfer_code.eq.${data.transfer_code},transfer_reference.eq.${data.reference}`)
      .single();

    if (findError || !withdrawal) {
      console.error('❌ Withdrawal not found:', data.transfer_code);
      return;
    }

    // Update withdrawal status
    await supabase
      .from('withdrawals')
      .update({
        status: 'reversed',
        provider_status: 'reversed',
        metadata: {
          ...withdrawal.metadata,
          paystack_reversal_data: data,
          reversed_at: new Date().toISOString()
        }
      })
      .eq('id', withdrawal.id);

    // Return funds to available balance
    await supabase
      .from('musician_wallets')
      .update({
        available_balance: supabase.raw(`available_balance + ${withdrawal.amount}`),
        pending_withdrawals: supabase.rpc('greatest', [0, supabase.raw(`pending_withdrawals - ${withdrawal.amount}`)])
      })
      .eq('musician_id', withdrawal.musician_id);

    // Send notification
    await supabase.from('notifications').insert({
      user_id: withdrawal.musician_id,
      type: 'withdrawal_reversed',
      title: '🔄 Withdrawal Reversed',
      message: `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} was reversed by the bank. Funds have been returned to your available balance.`,
      data: {
        withdrawal_id: withdrawal.id,
        amount: withdrawal.amount
      }
    });

    console.log(`🔄 Withdrawal ${withdrawal.id} reversed`);

  } catch (error) {
    console.error('❌ handleTransferReversed error:', error);
  }
}