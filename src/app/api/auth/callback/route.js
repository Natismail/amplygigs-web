// src/app/api/auth/callback/route.js - HANDLES OAUTH SIGNUP
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code);
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (user && !authError) {
      console.log('🔐 OAuth user authenticated:', user.id);
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (!existingProfile) {
        console.log('➕ Creating profile for OAuth user...');
        
        // Extract name from metadata
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const firstName = user.user_metadata?.given_name || 
                         user.user_metadata?.first_name || 
                         fullName.split(' ')[0] || 
                         'User';
        const lastName = user.user_metadata?.family_name || 
                        user.user_metadata?.last_name || 
                        fullName.split(' ').slice(1).join(' ') || 
                        '';
        const email = user.email || '';
        const avatarUrl = user.user_metadata?.avatar_url || 
                         user.user_metadata?.picture || 
                         null;
        
        console.log('👤 Extracted data:', {
          firstName,
          lastName,
          email,
          avatarUrl: avatarUrl ? 'yes' : 'no'
        });
        
        // Create profile
        const { data: newProfile, error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            profile_picture_url: avatarUrl,
            role: 'CLIENT', // Default role
            is_verified: true, // OAuth users are verified
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (profileError) {
          console.error('❌ Error creating profile:', profileError);
        } else {
          console.log('✅ Profile created successfully:', newProfile.id);
        }
      } else {
        console.log('✅ Profile already exists');
      }
    }
  }

  // Redirect to home or onboarding
  return NextResponse.redirect(new URL('/feed', requestUrl.origin));
}