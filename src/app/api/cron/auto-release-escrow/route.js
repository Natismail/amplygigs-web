// src/app/api/cron/auto-release-escrow/route.js
// AUTO-RELEASE ESCROW CRON JOB
// Runs every hour to release funds for completed gigs (24h after completion)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting auto-release escrow cron job...');
    const startTime = Date.now();

    // Find bookings that are:
    // 1. Status = 'completed' (musician marked complete)
    // 2. marked_complete_at is more than 24 hours ago
    // 3. Funds NOT yet released
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { data: eligibleBookings, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        id,
        marked_complete_at,
        funds_released_at,
        musician_id,
        client_id,
        amount,
        event_date,
        events:event_id(title)
      `)
      .eq('status', 'completed')
      .is('funds_released_at', null)
      .lt('marked_complete_at', twentyFourHoursAgo.toISOString());

    if (fetchError) {
      console.error('❌ Error fetching eligible bookings:', fetchError);
      return Response.json({ 
        success: false, 
        error: 'Failed to fetch bookings' 
      }, { status: 500 });
    }

    console.log(`📊 Found ${eligibleBookings?.length || 0} bookings eligible for auto-release`);

    if (!eligibleBookings || eligibleBookings.length === 0) {
      return Response.json({
        success: true,
        message: 'No bookings eligible for auto-release',
        processed: 0,
        duration: `${Date.now() - startTime}ms`
      });
    }

    // Process each booking
    const results = {
      total: eligibleBookings.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const booking of eligibleBookings) {
      try {
        console.log(`⏰ Auto-releasing booking ${booking.id}...`);

        // Find escrow transaction
        const { data: escrow, error: escrowError } = await supabase
          .from('escrow_transactions')
          .select('*')
          .eq('booking_id', booking.id)
          .eq('status', 'held')
          .single();

        if (escrowError || !escrow) {
          console.warn(`⚠️ No escrow found for booking ${booking.id}`);
          results.failed++;
          results.errors.push({
            booking_id: booking.id,
            error: 'No escrow found'
          });
          continue;
        }

        // Release funds using database function
        const { data: releaseResult, error: releaseError } = await supabase
          .rpc('release_escrow_funds', {
            p_escrow_id: escrow.id,
            p_released_by: null, // System auto-release
            p_release_type: 'auto_release'
          });

        if (releaseError) {
          console.error(`❌ Failed to release booking ${booking.id}:`, releaseError);
          results.failed++;
          results.errors.push({
            booking_id: booking.id,
            error: releaseError.message
          });
          continue;
        }

        console.log(`✅ Auto-released booking ${booking.id}: ₦${escrow.net_amount}`);
        results.successful++;

        // Send auto-release notifications
        await sendAutoReleaseNotifications(booking, escrow);

      } catch (error) {
        console.error(`❌ Error processing booking ${booking.id}:`, error);
        results.failed++;
        results.errors.push({
          booking_id: booking.id,
          error: error.message
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Auto-release cron completed: ${results.successful} released, ${results.failed} failed in ${duration}ms`);

    return Response.json({
      success: true,
      message: 'Auto-release cron completed',
      results,
      duration: `${duration}ms`
    });

  } catch (error) {
    console.error('❌ Auto-release cron error:', error);
    return Response.json({
      success: false,
      error: 'Cron job failed',
      details: error.message
    }, { status: 500 });
  }
}

// Send auto-release notifications
async function sendAutoReleaseNotifications(booking, escrow) {
  try {
    const currencySymbol = escrow.currency === 'NGN' ? '₦' : '$';

    // Notify musician
    await supabase.from('notifications').insert({
      user_id: booking.musician_id,
      type: 'funds_auto_released',
      title: '🎉 Funds Auto-Released!',
      message: `${currencySymbol}${escrow.net_amount.toLocaleString()} has been automatically released after 24 hours and is now available for withdrawal!`,
      data: {
        booking_id: booking.id,
        escrow_id: escrow.id,
        amount: escrow.net_amount,
        currency: escrow.currency,
        release_type: 'auto',
        event_title: booking.events?.title
      }
    });

    // Notify client
    await supabase.from('notifications').insert({
      user_id: booking.client_id,
      type: 'auto_release_notification',
      title: '✅ Payment Auto-Released',
      message: `${currencySymbol}${escrow.net_amount.toLocaleString()} was automatically released to the musician after 24 hours. Thank you for using AmplyGigs!`,
      data: {
        booking_id: booking.id,
        escrow_id: escrow.id,
        amount: escrow.net_amount,
        currency: escrow.currency,
        event_title: booking.events?.title
      }
    });

    console.log(`✅ Auto-release notifications sent for booking ${booking.id}`);
  } catch (error) {
    console.error('⚠️ Notification error:', error);
  }
}

// Also export POST for manual testing
export async function POST(req) {
  return GET(req);
}