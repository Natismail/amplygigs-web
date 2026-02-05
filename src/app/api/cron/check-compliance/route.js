// src/app/api/cron/check-compliance/route.js
// CHECK COMPLIANCE CRON JOB
// Runs weekly to monitor musician compliance and update scores

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

    console.log('📊 Starting compliance check cron job...');
    const startTime = Date.now();

    const results = {
      musicians_checked: 0,
      violations_found: 0,
      warnings_issued: 0,
      suspended: 0
    };

    // 1. Check for musicians with recent violations
    const { data: musicians, error: fetchError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        compliance:musician_compliance(*)
      `)
      .eq('role', 'MUSICIAN');

    if (fetchError) {
      console.error('❌ Error fetching musicians:', fetchError);
      return Response.json({
        success: false,
        error: 'Failed to fetch musicians'
      }, { status: 500 });
    }

    results.musicians_checked = musicians?.length || 0;
    console.log(`📊 Checking ${results.musicians_checked} musicians...`);

    // 2. Process each musician
    for (const musician of musicians || []) {
      try {
        const compliance = musician.compliance?.[0];
        
        if (!compliance) {
          console.log(`⚠️ No compliance record for ${musician.first_name} - skipping`);
          continue;
        }

        // Check violation thresholds
        const totalWarnings = compliance.late_cancellation_count + 
                            compliance.no_show_count + 
                            compliance.client_complaint_count;

        // Issue warning if threshold reached
        if (totalWarnings >= 3 && totalWarnings < 5) {
          await issueComplianceWarning(musician, compliance, 'warning');
          results.warnings_issued++;
        }

        // Suspend if critical threshold reached
        if (totalWarnings >= 5 || compliance.no_show_count >= 2) {
          await suspendMusician(musician, compliance);
          results.suspended++;
        }

        // Count violations
        if (totalWarnings > 0) {
          results.violations_found++;
        }

      } catch (error) {
        console.error(`❌ Error checking musician ${musician.id}:`, error);
      }
    }

    // 3. Check for old bookings that weren't completed
    await checkIncompleteBookings();

    const duration = Date.now() - startTime;
    console.log(`✅ Compliance check completed in ${duration}ms`);

    return Response.json({
      success: true,
      message: 'Compliance check completed',
      results,
      duration: `${duration}ms`
    });

  } catch (error) {
    console.error('❌ Compliance check error:', error);
    return Response.json({
      success: false,
      error: 'Cron job failed',
      details: error.message
    }, { status: 500 });
  }
}

// Issue compliance warning
async function issueComplianceWarning(musician, compliance, level) {
  try {
    console.log(`⚠️ Issuing ${level} to ${musician.first_name}`);

    const totalWarnings = compliance.late_cancellation_count + 
                         compliance.no_show_count + 
                         compliance.client_complaint_count;

    let message;
    if (level === 'warning') {
      message = `You have ${totalWarnings} compliance violations. Please maintain professionalism to avoid suspension. (Late cancellations: ${compliance.late_cancellation_count}, No-shows: ${compliance.no_show_count}, Complaints: ${compliance.client_complaint_count})`;
    } else {
      message = `FINAL WARNING: You have ${totalWarnings} compliance violations. One more violation may result in account suspension.`;
    }

    await supabase.from('notifications').insert({
      user_id: musician.id,
      type: 'compliance_warning',
      title: '⚠️ Compliance Warning',
      message,
      data: {
        compliance_id: compliance.id,
        total_warnings: totalWarnings,
        late_cancellations: compliance.late_cancellation_count,
        no_shows: compliance.no_show_count,
        complaints: compliance.client_complaint_count,
        level
      }
    });

    console.log(`✅ Warning sent to ${musician.first_name}`);
  } catch (error) {
    console.error('⚠️ Warning notification error:', error);
  }
}

// Suspend musician
async function suspendMusician(musician, compliance) {
  try {
    console.log(`🚫 Suspending musician ${musician.first_name}`);

    // Update profile to suspended
    await supabase
      .from('user_profiles')
      .update({
        verification_status: 'suspended',
        available: false
      })
      .eq('id', musician.id);

    // Send suspension notification
    await supabase.from('notifications').insert({
      user_id: musician.id,
      type: 'account_suspended',
      title: '🚫 Account Suspended',
      message: `Your account has been suspended due to multiple compliance violations (${compliance.late_cancellation_count} late cancellations, ${compliance.no_show_count} no-shows, ${compliance.client_complaint_count} complaints). Please contact support to appeal.`,
      data: {
        compliance_id: compliance.id,
        suspension_reason: 'multiple_violations',
        late_cancellations: compliance.late_cancellation_count,
        no_shows: compliance.no_show_count,
        complaints: compliance.client_complaint_count
      }
    });

    console.log(`✅ Musician ${musician.first_name} suspended`);
  } catch (error) {
    console.error('❌ Suspension error:', error);
  }
}

// Check for incomplete bookings
async function checkIncompleteBookings() {
  try {
    // Find bookings where event date passed >48h ago but not marked complete
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const { data: incompleteBookings } = await supabase
      .from('bookings')
      .select(`
        id,
        event_date,
        musician_id,
        client_id,
        status,
        events:event_id(title)
      `)
      .eq('status', 'confirmed')
      .eq('payment_status', 'paid')
      .lt('event_date', twoDaysAgo.toISOString())
      .is('marked_complete_at', null);

    if (incompleteBookings && incompleteBookings.length > 0) {
      console.log(`⚠️ Found ${incompleteBookings.length} incomplete bookings`);

      // Send reminders to musicians
      for (const booking of incompleteBookings) {
        await supabase.from('notifications').insert({
          user_id: booking.musician_id,
          type: 'completion_reminder',
          title: '⏰ Completion Reminder',
          message: `Please mark your gig "${booking.events?.title}" as complete to receive payment. The event was ${Math.floor((Date.now() - new Date(booking.event_date)) / (1000 * 60 * 60 * 24))} days ago.`,
          data: {
            booking_id: booking.id,
            event_title: booking.events?.title
          }
        });
      }
    }
  } catch (error) {
    console.error('⚠️ Incomplete bookings check error:', error);
  }
}

// Also export POST for manual testing
export async function POST(req) {
  return GET(req);
}