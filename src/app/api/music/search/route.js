// src/app/api/music/search/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const source = searchParams.get('source') || 'all'; // 'all', 'spotify', 'jamendo', 'uploads'
    const limit = parseInt(searchParams.get('limit') || '20');
    const genre = searchParams.get('genre');

    const results = {
      tracks: [],
      total: 0,
      sources: []
    };

    // Fetch from user uploads (Supabase)
    if (source === 'all' || source === 'uploads') {
      let uploadQuery = supabase
        .from('tracks')
        .select('*')
        .eq('is_published', true)
        .eq('is_external', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (query) {
        uploadQuery = uploadQuery.or(`title.ilike.%${query}%,artist_name.ilike.%${query}%`);
      }

      if (genre) {
        uploadQuery = uploadQuery.contains('genre', [genre]);
      }

      const { data: uploads, error } = await uploadQuery;
      
      if (!error && uploads) {
        results.tracks.push(...uploads.map(track => ({
          ...track,
          source: 'uploads',
          is_external: false
        })));
        results.sources.push('uploads');
      }
    }

    // Fetch from Spotify
    if (source === 'all' || source === 'spotify') {
      try {
        const spotifyUrl = new URL(`${request.nextUrl.origin}/api/music/spotify/search`);
        spotifyUrl.searchParams.set('q', query);
        spotifyUrl.searchParams.set('limit', String(limit));
        if (genre) spotifyUrl.searchParams.set('genre', genre);

        const spotifyRes = await fetch(spotifyUrl.toString());
        const spotifyData = await spotifyRes.json();
        
        if (spotifyData.tracks) {
          results.tracks.push(...spotifyData.tracks);
          results.sources.push('spotify');
        }
      } catch (err) {
        console.error('Spotify fetch failed:', err);
      }
    }

    // Fetch from Jamendo
    if (source === 'all' || source === 'jamendo') {
      try {
        const jamendoUrl = new URL(`${request.nextUrl.origin}/api/music/jamendo/search`);
        jamendoUrl.searchParams.set('q', query);
        jamendoUrl.searchParams.set('limit', String(limit));
        if (genre) jamendoUrl.searchParams.set('genre', genre);

        const jamendoRes = await fetch(jamendoUrl.toString());
        const jamendoData = await jamendoRes.json();
        
        if (jamendoData.tracks) {
          results.tracks.push(...jamendoData.tracks);
          results.sources.push('jamendo');
        }
      } catch (err) {
        console.error('Jamendo fetch failed:', err);
      }
    }

    results.total = results.tracks.length;

    return NextResponse.json(results);
  } catch (error) {
    console.error('Unified search error:', error);
    return NextResponse.json({ 
      error: 'Search failed',
      tracks: [],
      total: 0
    }, { status: 500 });
  }
}