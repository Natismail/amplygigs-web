// src/app/api/music/upload/track/route.js
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check upload credits
    const { data: credits } = await supabase
      .from('musician_upload_credits')
      .select('*')
      .eq('musician_id', userId)
      .single();

    if (!credits) {
      return NextResponse.json({ error: 'No credits record found' }, { status: 400 });
    }

    const remainingCredits = credits.credits_available - (credits.credits_used || 0);
    
    if (remainingCredits <= 0) {
      return NextResponse.json({ 
        error: 'No upload credits remaining',
        needs_purchase: true 
      }, { status: 403 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const coverImage = formData.get('cover');
    const title = formData.get('title');
    const artistName = formData.get('artist_name');
    const albumId = formData.get('album_id') || null;
    const description = formData.get('description') || '';
    const lyrics = formData.get('lyrics') || '';
    const genre = JSON.parse(formData.get('genre') || '[]');
    const isExplicit = formData.get('is_explicit') === 'true';
    const releaseDate = formData.get('release_date');

    if (!audioFile || !title || !artistName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upload audio file to Supabase Storage
    const audioFileName = `${userId}/${Date.now()}-${audioFile.name}`;
    const { data: audioUpload, error: audioError } = await supabase.storage
      .from('music-tracks')
      .upload(audioFileName, audioFile, {
        contentType: audioFile.type,
        upsert: false
      });

    if (audioError) {
      console.error('Audio upload error:', audioError);
      return NextResponse.json({ error: 'Failed to upload audio file' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl: audioUrl } } = supabase.storage
      .from('music-tracks')
      .getPublicUrl(audioFileName);

    // Upload cover image if provided
    let coverUrl = null;
    if (coverImage) {
      const coverFileName = `${userId}/${Date.now()}-${coverImage.name}`;
      const { data: coverUpload, error: coverError } = await supabase.storage
        .from('track-covers')
        .upload(coverFileName, coverImage, {
          contentType: coverImage.type,
          upsert: false
        });

      if (!coverError) {
        const { data: { publicUrl } } = supabase.storage
          .from('track-covers')
          .getPublicUrl(coverFileName);
        coverUrl = publicUrl;
      }
    }

    // Get audio duration (would need a library like music-metadata for this)
    // For now, we'll set it to 0 and update it later
    const duration = 0; // TODO: Extract from audio file

    // Create track record
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .insert({
        musician_id: userId,
        album_id: albumId,
        title,
        artist_name: artistName,
        description,
        lyrics,
        file_url: audioUrl,
        file_path: audioFileName,
        file_size: audioFile.size,
        duration,
        cover_image_url: coverUrl,
        genre,
        is_explicit: isExplicit,
        release_date: releaseDate,
        source: 'upload',
        is_external: false,
        is_published: false, // Require manual publish or auto-publish after review
        upload_fee_paid: remainingCredits > 5, // True if paid credits, false if free tier
        audio_quality: 'high'
      })
      .select()
      .single();

    if (trackError) {
      // Clean up uploaded files
      await supabase.storage.from('music-tracks').remove([audioFileName]);
      if (coverUrl) {
        const coverPath = coverUrl.split('/').pop();
        await supabase.storage.from('track-covers').remove([coverPath]);
      }
      
      console.error('Track creation error:', trackError);
      return NextResponse.json({ error: 'Failed to create track' }, { status: 500 });
    }

    // Increment credits used
    const { error: creditError } = await supabase
      .from('musician_upload_credits')
      .update({ 
        credits_used: (credits.credits_used || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('musician_id', userId);

    if (creditError) {
      console.error('Failed to update credits:', creditError);
    }

    return NextResponse.json({
      success: true,
      track,
      remaining_credits: remainingCredits - 1
    });

  } catch (error) {
    console.error('Upload track error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

// // Increase file size limit for audio uploads
// export const config = {
//   api: {
//     bodyParser: {
//       sizeLimit: '50mb'
//     }
//   }
// };