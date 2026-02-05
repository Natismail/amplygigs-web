// src/app/api/cron/process-withdrawals/route.js
// PROCESS WITHDRAWALS CRON JOB
// Runs daily to process pending withdrawal requests

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('💸 Starting withdrawal processing cron job...');
    const startTime = Date.now();

    // Find pending withdrawals
    const { data: pendingWithdrawals, error: fetchError } = await supabase
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
      .eq('status', 'pending')
      .order('requested_at', { ascending: true })
      .limit(50); // Process max 50 at a time

    if (fetchError) {
      console.error('❌ Error fetching withdrawals:', fetchError);
      return Response.json({
        success: false,
        error: 'Failed to fetch withdrawals'
      }, { status: 500 });
    }

    console.log(`📊 Found ${pendingWithdrawals?.length || 0} pending withdrawals`);

    if (!pendingWithdrawals || pendingWithdrawals.length === 0) {
      return Response.json({
        success: true,
        message: 'No pending withdrawals',
        processed: 0,
        duration: `${Date.now() - startTime}ms`
      });
    }

    const results = {
      total: pendingWithdrawals.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each withdrawal
    for (const withdrawal of pendingWithdrawals) {
      try {
        console.log(`💰 Processing withdrawal ${withdrawal.id} for ${withdrawal.musician.first_name}...`);

        // Call the withdrawal processing API internally
        const processResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/withdrawal/process-paystack`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            withdrawalId: withdrawal.id,
            musicianId: withdrawal.musician_id
          })
        });

        const processResult = await processResponse.json();

        if (processResult.success) {
          console.log(`✅ Withdrawal ${withdrawal.id} processed successfully`);
          results.successful++;
        } else {
          console.error(`❌ Withdrawal ${withdrawal.id} failed:`, processResult.error);
          results.failed++;
          results.errors.push({
            withdrawal_id: withdrawal.id,
            error: processResult.error
          });
        }

        // Add delay to avoid rate limiting (1 second between requests)
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error processing withdrawal ${withdrawal.id}:`, error);
        results.failed++;
        results.errors.push({
          withdrawal_id: withdrawal.id,
          error: error.message
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Withdrawal cron completed: ${results.successful} processed, ${results.failed} failed in ${duration}ms`);

    return Response.json({
      success: true,
      message: 'Withdrawal processing completed',
      results,
      duration: `${duration}ms`
    });

  } catch (error) {
    console.error('❌ Withdrawal cron error:', error);
    return Response.json({
      success: false,
      error: 'Cron job failed',
      details: error.message
    }, { status: 500 });
  }
}

// Also export POST for manual testing
export async function POST(req) {
  return GET(req);
}