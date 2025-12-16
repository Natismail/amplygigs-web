// src/app/api/withdraw.js
import Flutterwave from 'flutterwave-node-v3';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WITHDRAWAL_FEE = 50; // ₦50 flat fee
const MIN_WITHDRAWAL = 1000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, bank_account_id, musician_id } = req.body;

  // Validation
  if (!amount || !bank_account_id || !musician_id) {
    return res.status(400).json({ 
      success: false,
      error: 'Missing required fields' 
    });
  }

  const amountNum = parseFloat(amount);

  if (amountNum < MIN_WITHDRAWAL) {
    return res.status(400).json({
      success: false,
      error: `Minimum withdrawal is ₦${MIN_WITHDRAWAL}`
    });
  }

  try {
    // 1. Get musician's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('musician_wallets')
      .select('*')
      .eq('musician_id', musician_id)
      .single();

    if (walletError || !wallet) {
      return res.status(404).json({ 
        success: false,
        error: 'Wallet not found' 
      });
    }

    // 2. Check available balance
    if (wallet.available_balance < amountNum) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient available balance'
      });
    }

    // 3. Get bank account details
    const { data: bankAccount, error: bankError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', bank_account_id)
      .eq('musician_id', musician_id)
      .single();

    if (bankError || !bankAccount) {
      return res.status(404).json({
        success: false,
        error: 'Bank account not found'
      });
    }

    // 4. Calculate net amount
    const netAmount = amountNum - WITHDRAWAL_FEE;

    // 5. Create withdrawal record
    const withdrawalRef = `WD_${musician_id.substring(0, 8)}_${Date.now()}`;

    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        musician_id: musician_id,
        bank_account_id: bank_account_id,
        amount: amountNum,
        withdrawal_fee: WITHDRAWAL_FEE,
        net_amount: netAmount,
        currency: 'NGN',
        status: 'pending',
        provider: 'flutterwave',
        provider_reference: withdrawalRef
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('Withdrawal creation error:', withdrawalError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create withdrawal record'
      });
    }

    // 6. Initiate Flutterwave transfer
    const flw = new Flutterwave(
      process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      process.env.FLUTTERWAVE_SECRET_KEY
    );

    const transferPayload = {
      account_bank: bankAccount.bank_code,
      account_number: bankAccount.account_number,
      amount: netAmount,
      narration: 'AmplyGigs Withdrawal',
      currency: 'NGN',
      reference: withdrawalRef,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/withdrawal`,
      debit_currency: 'NGN'
    };

    const transferResponse = await flw.Transfer.initiate(transferPayload);

    if (transferResponse.status === 'success') {
      // 7. Update withdrawal status
      await supabase
        .from('withdrawals')
        .update({
          status: 'processing',
          provider_reference: transferResponse.data.id,
          provider_status: transferResponse.data.status,
          metadata: {
            flutterwave_response: transferResponse.data
          },
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawal.id);

      // 8. Update wallet - deduct from available balance
      const newAvailableBalance = wallet.available_balance - amountNum;
      const newPendingWithdrawals = wallet.pending_withdrawals + amountNum;
      const newTotalWithdrawn = wallet.total_withdrawn + netAmount;

      await supabase
        .from('musician_wallets')
        .update({
          available_balance: newAvailableBalance,
          pending_withdrawals: newPendingWithdrawals,
          total_withdrawn: newTotalWithdrawn,
          last_withdrawal_at: new Date().toISOString()
        })
        .eq('musician_id', musician_id);

      // 9. Create transaction record
      await supabase
        .from('transactions')
        .insert({
          musician_id: musician_id,
          transaction_type: 'withdrawal',
          amount: amountNum,
          platform_fee: WITHDRAWAL_FEE,
          net_amount: netAmount,
          currency: 'NGN',
          transaction_ref: withdrawalRef,
          payment_status: 'processing',
          payment_provider: 'flutterwave',
          description: `Withdrawal to ${bankAccount.bank_name}`,
          metadata: {
            bank_account_id: bank_account_id,
            withdrawal_id: withdrawal.id
          }
        });

      return res.status(200).json({
        success: true,
        message: 'Withdrawal initiated successfully',
        data: {
          withdrawal_id: withdrawal.id,
          amount: amountNum,
          fee: WITHDRAWAL_FEE,
          net_amount: netAmount,
          status: 'processing',
          reference: withdrawalRef
        }
      });

    } else {
      // Transfer failed
      await supabase
        .from('withdrawals')
        .update({
          status: 'failed',
          failure_reason: transferResponse.message || 'Transfer initiation failed',
          failed_at: new Date().toISOString()
        })
        .eq('id', withdrawal.id);

      return res.status(400).json({
        success: false,
        error: transferResponse.message || 'Failed to initiate transfer'
      });
    }

  } catch (error) {
    console.error('Withdrawal error:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    });
  }
}