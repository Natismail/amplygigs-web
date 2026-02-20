// src/app/api/music/upload/check-credits/route.js
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's upload credits
    const { data: credits, error: creditsError } = await supabase
      .from('musician_upload_credits')
      .select('*')
      .eq('musician_id', userId)
      .single();

    if (creditsError) {
      // Create credits record if it doesn't exist
      const { data: newCredits, error: createError } = await supabase
        .from('musician_upload_credits')
        .insert({
          musician_id: userId,
          credits_available: 5, // 5 free uploads
          credits_used: 0
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return NextResponse.json({
        credits_available: 5,
        credits_used: 0,
        total_tracks: 0,
        can_upload: true,
        is_free_tier: true
      });
    }

    // Get total tracks uploaded
    const { count: totalTracks } = await supabase
      .from('tracks')
      .select('*', { count: 'exact', head: true })
      .eq('musician_id', userId)
      .eq('is_external', false);

    const creditsAvailable = credits.credits_available;
    const creditsUsed = credits.credits_used || 0;
    const remainingCredits = creditsAvailable - creditsUsed;
    const canUpload = remainingCredits > 0;

    return NextResponse.json({
      credits_available: creditsAvailable,
      credits_used: creditsUsed,
      remaining_credits: remainingCredits,
      total_tracks: totalTracks || 0,
      can_upload: canUpload,
      is_free_tier: creditsAvailable === 5,
      total_spent: credits.total_spent || 0
    });

  } catch (error) {
    console.error('Check credits error:', error);
    return NextResponse.json({ error: 'Failed to check credits' }, { status: 500 });
  }
}