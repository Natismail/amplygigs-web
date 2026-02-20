
// // SECURE JOB PAYMENT VERIFICATION API
// import { createClient } from '@supabase/supabase-js';

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ Server-side only!
// );

export async function POST(req) {
  try {
    const { reference, jobId } = await req.json();

    if (!reference || !jobId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('🔍 Verifying job payment:', { reference, jobId });

    // 1. Verify payment with Paystack (BACKEND ONLY!)
    const verificationResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await verificationResponse.json();

    console.log('📊 Paystack response:', result);

    // 2. Check if payment was successful
    if (!result.status || result.data.status !== 'success') {
      console.log('❌ Payment not successful');
      return Response.json({
        success: false,
        error: 'Payment verification failed'
      }, { status: 400 });
    }

    // 3. Verify amount matches (prevent price manipulation)
    const paidAmount = result.data.amount / 100; // Convert from kobo
    const expectedAmount = 10000; // ₦10,000

    if (paidAmount !== expectedAmount) {
      console.error('⚠️ Amount mismatch:', { paidAmount, expectedAmount });
      return Response.json({
        success: false,
        error: 'Payment amount mismatch'
      }, { status: 400 });
    }

    // 4. Check metadata matches job ID
    const paidJobId = result.data.metadata?.custom_fields?.find(
      field => field.variable_name === 'job_posting_id'
    )?.value;

    if (paidJobId !== jobId) {
      console.error('⚠️ Job ID mismatch:', { paidJobId, jobId });
      return Response.json({
        success: false,
        error: 'Job ID mismatch'
      }, { status: 400 });
    }

    // 5. Update database (SERVER-SIDE ONLY!)
    const { data: job, error: updateError } = await supabase
      .from('job_postings')
      .update({
        posting_fee_paid: true,
        posting_payment_reference: reference,
        status: 'active',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      return Response.json({
        success: false,
        error: 'Failed to update job posting'
      }, { status: 500 });
    }

    console.log('✅ Job payment verified and activated');

    // 6. Send confirmation notification
    await sendJobPostingConfirmation(job);

    return Response.json({
      success: true,
      job: {
        id: job.id,
        title: job.title,
        status: job.status
      }
    });

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

async function sendJobPostingConfirmation(job) {
  try {
    await supabase.from('notifications').insert({
      user_id: job.posted_by,
      type: 'job_posting_activated',
      title: '✅ Job Posted Successfully!',
      message: `Your job posting "${job.title}" is now live and accepting applications.`,
      data: {
        job_id: job.id,
        job_title: job.title,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    });
  } catch (error) {
    console.error('Notification error:', error);
  }
}