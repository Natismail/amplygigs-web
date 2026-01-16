// src/app/api/auth/sync-profile/route.js - FIXED COOKIES ERROR
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * This endpoint syncs existing OAuth users' data from auth.users to user_profiles
 * Call this for users who signed up before the callback handler was added
 */
export async function POST(request) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Create supabase client with the user's token
    const token = authHeader.replace('Bearer ', '');
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

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('🔄 Syncing profile for user:', user.id);
    console.log('📋 User metadata:', user.user_metadata);

    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // Extract name from metadata
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
    const firstName = user.user_metadata?.given_name || 
                     user.user_metadata?.first_name || 
                     fullName.split(' ')[0] || 
                     existingProfile?.first_name ||
                     'User';
    const lastName = user.user_metadata?.family_name || 
                    user.user_metadata?.last_name || 
                    fullName.split(' ').slice(1).join(' ') || 
                    existingProfile?.last_name ||
                    '';
    const avatarUrl = user.user_metadata?.avatar_url || 
                     user.user_metadata?.picture || 
                     existingProfile?.profile_picture_url ||
                     null;

    console.log('📝 Extracted data:', {
      firstName,
      lastName,
      email: user.email,
      avatarUrl: avatarUrl ? 'yes' : 'no',
      existingProfile: existingProfile ? 'yes' : 'no'
    });

    if (existingProfile) {
      // Update existing profile
      const updates = {};
      
      // Only update if better data available
      if (firstName !== 'User' && firstName !== existingProfile.first_name) {
        updates.first_name = firstName;
      }
      if (lastName && lastName !== existingProfile.last_name) {
        updates.last_name = lastName;
      }
      if (avatarUrl && !existingProfile.profile_picture_url) {
        updates.profile_picture_url = avatarUrl;
      }
      if (!existingProfile.is_verified && user.confirmed_at) {
        updates.is_verified = true;
      }

      if (Object.keys(updates).length > 0) {
        console.log('⬆️ Updating profile with:', updates);
        
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Update error:', updateError);
          throw updateError;
        }

        console.log('✅ Profile updated successfully');
        return NextResponse.json({
          message: 'Profile updated successfully',
          profile: updatedProfile,
          updated: updates,
        });
      } else {
        console.log('ℹ️ No updates needed');
        return NextResponse.json({
          message: 'Profile already up to date',
          profile: existingProfile,
        });
      }
    } else {
      // Create new profile
      console.log('➕ Creating new profile...');
      
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          profile_picture_url: avatarUrl,
          role: 'CLIENT',
          is_verified: !!user.confirmed_at,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Create error:', createError);
        throw createError;
      }

      console.log('✅ Profile created successfully');
      return NextResponse.json({
        message: 'Profile created successfully',
        profile: newProfile,
      });
    }
  } catch (error) {
    console.error('❌ Sync profile error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to sync profile',
        details: error.details || null,
      },
      { status: 500 }
    );
  }
}

// GET - Check sync status
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
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
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get auth metadata
    const metadata = user.user_metadata || {};

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        confirmed_at: user.confirmed_at,
      },
      metadata: {
        full_name: metadata.full_name || metadata.name,
        given_name: metadata.given_name || metadata.first_name,
        family_name: metadata.family_name || metadata.last_name,
        avatar_url: metadata.avatar_url || metadata.picture,
      },
      profile: profile ? {
        first_name: profile.first_name,
        last_name: profile.last_name,
        profile_picture_url: profile.profile_picture_url,
        is_verified: profile.is_verified,
      } : null,
      needs_sync: !profile || 
                  profile.first_name === 'User' ||
                  (!profile.profile_picture_url && (metadata.avatar_url || metadata.picture)),
    });
  } catch (error) {
    console.error('Error checking sync status:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}