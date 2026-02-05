// src/app/api/withdrawal/process-paystack/route.js
// PAYSTACK WITHDRAWAL API - Process musician withdrawals

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { withdrawalId, musicianId } = await req.json();

    if (!withdrawalId || !musicianId) {
      return Response.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    console.log('💸 Processing withdrawal:', { withdrawalId, musicianId });

    // 1. Get withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .select(`
        *,
        musician:musician_id(
          id,
          first_name,
          last_name,
          email
        ),
        bank_account:bank_account_id!bank_accounts(
          account_number,
          account_name,
          bank_code,
          bank_name
        )
      `)
      .eq('id', withdrawalId)
      .eq('musician_id', musicianId)
      .single();

    if (withdrawalError || !withdrawal) {
      console.error('❌ Withdrawal not found:', withdrawalError);
      return Response.json({
        success: false,
        error: 'Withdrawal request not found'
      }, { status: 404 });
    }

    // 2. Check withdrawal status
    if (withdrawal.status !== 'pending') {
      return Response.json({
        success: false,
        error: `Withdrawal already ${withdrawal.status}`
      }, { status: 400 });
    }

    // 3. Get musician wallet to verify balance
    const { data: wallet, error: walletError } = await supabase
      .from('musician_wallets')
      .select('*')
      .eq('musician_id', musicianId)
      .single();

    if (walletError || !wallet) {
      console.error('❌ Wallet not found:', walletError);
      return Response.json({
        success: false,
        error: 'Wallet not found'
      }, { status: 404 });
    }

    // 4. Verify sufficient balance
    if (wallet.available_balance < withdrawal.amount) {
      console.error('❌ Insufficient balance');
      
      // Update withdrawal as failed
      await supabase
        .from('withdrawals')
        .update({
          status: 'failed',
          failure_reason: 'Insufficient balance',
          failed_at: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      return Response.json({
        success: false,
        error: 'Insufficient balance'
      }, { status: 400 });
    }

    console.log('✅ Balance verified. Initiating Paystack transfer...');

    // 5. Update withdrawal to processing
    await supabase
      .from('withdrawals')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString()
      })
      .eq('id', withdrawalId);

    // 6. Create Paystack transfer recipient (if not exists)
    let recipientCode = withdrawal.recipient_code;

    if (!recipientCode) {
      const recipientResult = await createPaystackRecipient(
        withdrawal.bank_account.account_number,
        withdrawal.bank_account.bank_code,
        withdrawal.bank_account.account_name
      );

      if (!recipientResult.success) {
        console.error('❌ Failed to create recipient:', recipientResult.error);
        
        await supabase
          .from('withdrawals')
          .update({
            status: 'failed',
            failure_reason: `Recipient creation failed: ${recipientResult.error}`,
            failed_at: new Date().toISOString()
          })
          .eq('id', withdrawalId);

        return Response.json({
          success: false,
          error: 'Failed to create transfer recipient',
          details: recipientResult.error
        }, { status: 500 });
      }

      recipientCode = recipientResult.data.recipient_code;

      // Save recipient code for future use
      await supabase
        .from('withdrawals')
        .update({ recipient_code: recipientCode })
        .eq('id', withdrawalId);
    }

    // 7. Initiate Paystack transfer
    const transferResult = await initiatePaystackTransfer(
      withdrawal.amount,
      recipientCode,
      `Withdrawal for ${withdrawal.musician.first_name} ${withdrawal.musician.last_name}`,
      withdrawalId
    );

    if (!transferResult.success) {
      console.error('❌ Transfer initiation failed:', transferResult.error);
      
      await supabase
        .from('withdrawals')
        .update({
          status: 'failed',
          failure_reason: `Transfer failed: ${transferResult.error}`,
          failed_at: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      return Response.json({
        success: false,
        error: 'Transfer initiation failed',
        details: transferResult.error
      }, { status: 500 });
    }

    console.log('✅ Transfer initiated:', transferResult.data.transfer_code);

    // 8. Update withdrawal with Paystack details
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        transfer_code: transferResult.data.transfer_code,
        provider_reference: transferResult.data.id,
        transfer_reference: transferResult.data.reference,
        metadata: {
          ...withdrawal.metadata,
          paystack_response: transferResult.data
        }
      })
      .eq('id', withdrawalId);

    if (updateError) {
      console.error('⚠️ Update error:', updateError);
    }

    // 9. Deduct from wallet (pending withdrawals)
    await supabase
      .from('musician_wallets')
      .update({
        available_balance: wallet.available_balance - withdrawal.amount,
        pending_withdrawals: wallet.pending_withdrawals + withdrawal.amount
      })
      .eq('musician_id', musicianId);

    console.log('✅ Wallet updated. Transfer pending...');

    // 10. Send notification
    await sendWithdrawalNotification(withdrawal, 'processing');

    return Response.json({
      success: true,
      message: 'Withdrawal processing',
      data: {
        withdrawal_id: withdrawalId,
        amount: withdrawal.amount,
        transfer_code: transferResult.data.transfer_code,
        status: 'processing'
      }
    });

  } catch (error) {
    console.error('❌ Withdrawal processing error:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// Create Paystack transfer recipient
async function createPaystackRecipient(accountNumber, bankCode, accountName) {
  try {
    const response = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN'
      })
    });

    const result = await response.json();

    if (result.status && result.data) {
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: false,
        error: result.message || 'Failed to create recipient'
      };
    }
  } catch (error) {
    console.error('❌ Create recipient error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Initiate Paystack transfer
async function initiatePaystackTransfer(amount, recipientCode, reason, reference) {
  try {
    // Convert to kobo (Paystack requires smallest currency unit)
    const amountInKobo = Math.round(amount * 100);

    const response = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: 'balance',
        amount: amountInKobo,
        recipient: recipientCode,
        reason: reason,
        reference: `WD_${reference}_${Date.now()}`
      })
    });

    const result = await response.json();

    if (result.status && result.data) {
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: false,
        error: result.message || 'Transfer initiation failed'
      };
    }
  } catch (error) {
    console.error('❌ Transfer error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Send withdrawal notification
async function sendWithdrawalNotification(withdrawal, status) {
  try {
    const currencySymbol = withdrawal.currency === 'NGN' ? '₦' : '$';
    
    let title, message;
    
    if (status === 'processing') {
      title = '⏳ Withdrawal Processing';
      message = `Your withdrawal of ${currencySymbol}${withdrawal.amount.toLocaleString()} is being processed. Funds will arrive in your bank account within 24 hours.`;
    } else if (status === 'completed') {
      title = '✅ Withdrawal Successful';
      message = `${currencySymbol}${withdrawal.amount.toLocaleString()} has been sent to your bank account ${withdrawal.bank_account.account_name}.`;
    } else if (status === 'failed') {
      title = '❌ Withdrawal Failed';
      message = `Your withdrawal of ${currencySymbol}${withdrawal.amount.toLocaleString()} failed. Please try again or contact support.`;
    }

    await supabase.from('notifications').insert({
      user_id: withdrawal.musician_id,
      type: `withdrawal_${status}`,
      title,
      message,
      data: {
        withdrawal_id: withdrawal.id,
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        status
      }
    });

    console.log(`✅ Withdrawal ${status} notification sent`);
  } catch (error) {
    console.error('⚠️ Notification error:', error);
  }
}