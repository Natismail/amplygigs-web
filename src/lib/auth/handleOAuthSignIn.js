// src/lib/auth/handleOAuthSignIn.js - FIXED VERSION
// This extracts names from OAuth providers and saves to user_profiles

export async function handleOAuthSignIn(user) {
  if (!user) return;

  try {
    console.log('🔐 OAuth sign-in detected for:', user.email);
    console.log('📋 User metadata:', user.user_metadata);

    // ⭐ CRITICAL: Extract name from OAuth provider metadata
    const metadata = user.user_metadata || {};
    let firstName = '';
    let lastName = '';
    let profilePictureUrl = '';

    // Extract from full_name or name field
    if (metadata.full_name || metadata.name) {
      const fullName = metadata.full_name || metadata.name;
      const nameParts = fullName.trim().split(' ');
      
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
      
      console.log('✅ Extracted names:', { firstName, lastName });
    }

    // Extract profile picture
    profilePictureUrl = metadata.avatar_url || metadata.picture || '';

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', checkError);
      return;
    }

    if (existingProfile) {
      // ⭐ Update existing profile if names are empty
      if (!existingProfile.first_name && !existingProfile.last_name && firstName) {
        console.log('📝 Updating existing profile with OAuth names');
        
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            first_name: firstName,
            last_name: lastName,
            profile_picture_url: profilePictureUrl,
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('❌ Error updating profile:', updateError);
        } else {
          console.log('✅ Profile updated with OAuth data');
        }
      }
    } else {
      // ⭐ Create new profile with OAuth data
      console.log('📝 Creating new profile with OAuth names');
      
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          profile_picture_url: profilePictureUrl,
          role: 'CLIENT', // Default role
        });

      if (insertError) {
        console.error('❌ Error creating profile:', insertError);
      } else {
        console.log('✅ Profile created with OAuth data');
      }
    }
  } catch (error) {
    console.error('❌ Exception in handleOAuthSignIn:', error);
  }
}


// ⭐ ADD THIS TO YOUR AuthContext.js or wherever you handle sign-in:

// After successful OAuth sign-in:
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const provider = session.user.app_metadata?.provider;
        
        // ⭐ If OAuth provider, extract and save names
        if (provider === 'google' || provider === 'facebook') {
          await handleOAuthSignIn(session.user);
        }
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);