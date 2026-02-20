// src/app/api/musician/media/view/route.js
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { video_id, viewer_id } = body;

    if (!video_id) {
      return NextResponse.json({ error: 'video_id required' }, { status: 400 });
    }

    // Record view
    await supabase
      .from('video_views')
      .insert({
        video_id,
        viewer_id: viewer_id || null,
        viewer_ip: request.headers.get('x-forwarded-for') || 'unknown',
      });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Record view error:', error);
    return NextResponse.json({ 
      error: 'Failed to record view' 
    }, { status: 500 });
  }
}