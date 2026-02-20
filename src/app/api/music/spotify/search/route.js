// src/app/api/music/spotify/search/route.js
import { NextResponse } from 'next/server';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

let spotifyAccessToken = null;
let tokenExpiresAt = 0;

async function getSpotifyToken() {
  // Return cached token if still valid
  if (spotifyAccessToken && Date.now() < tokenExpiresAt) {
    return spotifyAccessToken;
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  spotifyAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min early
  
  return spotifyAccessToken;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'track'; // track, album, artist
    const limit = searchParams.get('limit') || '20';
    const genre = searchParams.get('genre'); // Optional genre filter

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const token = await getSpotifyToken();

    // Build search query
    let searchQuery = query;
    if (genre) {
      searchQuery += ` genre:${genre}`;
    }

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=${type}&limit=${limit}&market=NG`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    // Transform Spotify data to AmplyGigs format
    const tracks = data.tracks?.items.map((track) => ({
      id: track.id,
      title: track.name,
      artist_name: track.artists.map((a) => a.name).join(', '),
      album_name: track.album.name,
      cover_image_url: track.album.images[0]?.url || null,
      duration: Math.floor(track.duration_ms / 1000),
      preview_url: track.preview_url, // 30-second preview MP3
      external_url: track.external_urls.spotify,
      external_id: track.id,
      source: 'spotify',
      is_external: true,
      release_date: track.album.release_date,
      genre: [], // Spotify doesn't return genres in track search
      popularity: track.popularity, // 0-100 score
    })) || [];

    return NextResponse.json({ 
      tracks, 
      total: data.tracks?.total || 0,
      source: 'spotify'
    });
  } catch (error) {
    console.error('Spotify search error:', error);
    return NextResponse.json({ 
      error: 'Spotify search failed',
      tracks: [] 
    }, { status: 500 });
  }
}