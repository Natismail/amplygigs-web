// src/app/api/cron/cleanup-notifications/route.js
// CLEANUP NOTIFICATIONS CRON JOB
// Runs daily to clean up old notifications

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

    console.log('🧹 Starting notification cleanup cron job...');
    const startTime = Date.now();

    // 1. Auto-mark old notifications as read (30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { data: markedRead, error: markError } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false)
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select('id');

    const readCount = markedRead?.length || 0;
    console.log(`✅ Marked ${readCount} old notifications as read`);

    // 2. Delete very old notifications (90 days) that are read
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const { data: deleted, error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('read', true)
      .lt('created_at', ninetyDaysAgo.toISOString())
      .select('id');

    const deletedCount = deleted?.length || 0;
    console.log(`✅ Deleted ${deletedCount} very old notifications`);

    // 3. Get notification statistics
    const { data: stats } = await supabase
      .from('notifications')
      .select('read, created_at')
      .order('created_at', { ascending: false });

    const totalNotifications = stats?.length || 0;
    const unreadNotifications = stats?.filter(n => !n.read).length || 0;

    const duration = Date.now() - startTime;
    console.log(`✅ Notification cleanup completed in ${duration}ms`);

    return Response.json({
      success: true,
      message: 'Notification cleanup completed',
      results: {
        marked_as_read: readCount,
        deleted: deletedCount,
        total_remaining: totalNotifications,
        unread_remaining: unreadNotifications
      },
      duration: `${duration}ms`
    });

  } catch (error) {
    console.error('❌ Notification cleanup error:', error);
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