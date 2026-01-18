// src/app/api/notifications/preferences/route.js - WITH DEBUG LOGGING
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const DEFAULT_PREFERENCES = {
  // Communication Channels
  email_notifications: true,
  push_notifications: true,
  sms_notifications: false,
  
  // Activity Types
  bookings: true,
  payments: true,
  messages: true,
  followers: true,
  reviews: true,
  
  // System
  marketing: false,
  system_updates: true,
};

export async function GET(request) {
  try {
    console.log('🔍 GET /api/notifications/preferences - Start');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ No auth header');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    console.log('🔐 Getting user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('👤 User ID:', user.id);
    console.log('📊 Fetching preferences...');

    const { data, error } = await supabase
      .from('user_profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('❌ Error fetching preferences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Current preferences:', data?.notification_preferences);

    // Merge with defaults to ensure all keys exist
    const preferences = {
      ...DEFAULT_PREFERENCES,
      ...(data?.notification_preferences || {}),
    };

    console.log('✅ Merged preferences:', preferences);

    return NextResponse.json({ preferences });

  } catch (error) {
    console.error('❌ GET preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    console.log('🔍 PATCH /api/notifications/preferences - Start');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ No auth header');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    console.log('🔐 Getting user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('👤 User ID:', user.id);

    const body = await request.json();
    const { preferences } = body;

    if (!preferences) {
      console.log('❌ No preferences in body');
      return NextResponse.json(
        { error: 'Missing preferences' },
        { status: 400 }
      );
    }

    console.log('📥 Received preferences:', preferences);

    // Validate and sanitize all preferences
    const validPreferences = {
      // Communication Channels
      email_notifications: Boolean(preferences.email_notifications),
      push_notifications: Boolean(preferences.push_notifications),
      sms_notifications: Boolean(preferences.sms_notifications),
      
      // Activity Types
      bookings: Boolean(preferences.bookings),
      payments: Boolean(preferences.payments),
      messages: Boolean(preferences.messages),
      followers: Boolean(preferences.followers),
      reviews: Boolean(preferences.reviews),
      
      // System
      marketing: Boolean(preferences.marketing),
      system_updates: Boolean(preferences.system_updates),
    };

    console.log('✅ Validated preferences:', validPreferences);
    console.log('💾 Updating database...');

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        notification_preferences: validPreferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('notification_preferences')
      .single();

    if (error) {
      console.error('❌ Database update error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Failed to update preferences', details: error.message, hint: error.hint },
        { status: 500 }
      );
    }

    console.log('✅ Update successful:', data);

    return NextResponse.json({ 
      success: true, 
      preferences: data.notification_preferences 
    });

  } catch (error) {
    console.error('❌ PATCH preferences error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}