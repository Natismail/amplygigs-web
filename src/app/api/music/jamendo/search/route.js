// src/app/api/music/jamendo/search/route.js
import { NextResponse } from 'next/server';

const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = searchParams.get('limit') || '20';
    const genre = searchParams.get('genre'); // Optional

    // Build Jamendo API URL
    let apiUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=${limit}&audioformat=mp32&include=musicinfo`;
    
    if (query) {
      apiUrl += `&search=${encodeURIComponent(query)}`;
    }
    
    if (genre) {
      apiUrl += `&tags=${encodeURIComponent(genre)}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    const tracks = data.results.map((track) => ({
      id: track.id,
      title: track.name,
      artist_name: track.artist_name,
      album_name: track.album_name,
      cover_image_url: track.album_image || track.image,
      duration: track.duration,
      streaming_url: track.audio, // ✅ Full-length MP3 stream!
      preview_url: track.audiodownload, // Download URL
      external_url: track.shareurl,
      external_id: String(track.id),
      source: 'jamendo',
      is_external: true,
      release_date: track.releasedate,
      genre: track.musicinfo?.tags?.genres || [],
      license_ccurl: track.license_ccurl, // Creative Commons license
    }));

    return NextResponse.json({ 
      tracks, 
      total: data.headers.results_count,
      source: 'jamendo'
    });
  } catch (error) {
    console.error('Jamendo search error:', error);
    return NextResponse.json({ 
      error: 'Jamendo search failed',
      tracks: []
    }, { status: 500 });
  }
}