// src/app/auth/callback/route.js

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Service role client — bypasses RLS for profile creation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const requestUrl     = new URL(request.url);
  const code             = requestUrl.searchParams.get('code');
  const error            = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  console.log('🔐 Auth callback:', { hasCode: !!code, error });

  // Supabase error (expired link, etc.)
  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/login`);
  }

  try {
    // Use route handler client so session cookie is set correctly
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data?.user) {
      console.error('❌ Code exchange failed:', exchangeError);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=verification_failed`
      );
    }

    const user     = data.user;
    const meta     = user.user_metadata ?? {};
    const provider = user.app_metadata?.provider ?? 'email';

    console.log('✅ Verified:', user.email, '| provider:', provider);

    // ── Create or backfill profile ─────────────────────────────────────────
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('id, first_name, last_name, role, is_admin, is_support')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      // Extract name — works for both email signup metadata and OAuth providers
      let firstName = meta.first_name ?? meta.given_name ?? '';
      let lastName  = meta.last_name  ?? meta.family_name ?? '';

      if (!firstName && (meta.full_name || meta.name)) {
        const parts = (meta.full_name || meta.name).trim().split(' ');
        firstName = parts[0] ?? '';
        lastName  = parts.slice(1).join(' ') ?? '';
      }

      await supabaseAdmin.from('user_profiles').insert({
        id:                  user.id,
        email:               user.email,
        first_name:          firstName,
        last_name:           lastName,
        phone:               meta.phone ?? null,
        role:                meta.role  ?? 'CLIENT',
        profile_picture_url: meta.avatar_url || meta.picture || null,
      });

      console.log('✅ Profile created for:', user.email);

    } else if (provider !== 'email' && !existingProfile.first_name) {
      // OAuth user with missing name — backfill
      const parts = (meta.full_name || meta.name || '').trim().split(' ');
      await supabaseAdmin.from('user_profiles').update({
        first_name:          meta.given_name  || parts[0] || '',
        last_name:           meta.family_name || parts.slice(1).join(' ') || '',
        profile_picture_url: meta.avatar_url  || meta.picture || null,
      }).eq('id', user.id);

      console.log('✅ OAuth profile backfilled for:', user.email);
    }

    // ── Role-aware redirect ────────────────────────────────────────────────
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role, is_admin, is_support')
      .eq('id', user.id)
      .single();

    const role = (profile?.role ?? '').toLowerCase();

    let redirectTo = '/client/home';
    if      (profile?.is_admin   || role === 'admin')   redirectTo = '/admin/dashboard';
    else if (profile?.is_support || role === 'support')  redirectTo = '/admin/dashboard';
    else if (role === 'musician')                        redirectTo = '/musician/dashboard';

    console.log('🔀 Redirecting to:', redirectTo);
    return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`);

  } catch (err) {
    console.error('❌ Auth callback exception:', err);
    return NextResponse.redirect(`${requestUrl.origin}/login?error=unexpected_error`);
  }
}
































// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
// import { cookies } from 'next/headers';
// import { NextResponse } from 'next/server';

// export async function GET(request) {
//   const requestUrl = new URL(request.url);
//   const code = requestUrl.searchParams.get('code');
//   const next = requestUrl.searchParams.get('next') || '/';
//   const error = requestUrl.searchParams.get('error');
//   const errorDescription = requestUrl.searchParams.get('error_description');

//   console.log('🔐 Auth callback:', { code: !!code, error, errorDescription });

//   if (error) {
//     return NextResponse.redirect(
//       `${requestUrl.origin}/login?error=${encodeURIComponent(errorDescription || error)}`
//     );
//   }

//   if (code) {
//     const supabase = createRouteHandlerClient({ cookies });

//     try {
//       // Exchange code for session
//       const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

//       if (exchangeError) {
//         console.error('❌ Error exchanging code:', exchangeError);
//         return NextResponse.redirect(
//           `${requestUrl.origin}/login?error=${encodeURIComponent(exchangeError.message)}`
//         );
//       }

//       console.log('✅ Email verified successfully');

//       // Redirect to dashboard based on role
//       if (data?.user) {
//         const { data: profile } = await supabase
//           .from('user_profiles')
//           .select('role')
//           .eq('id', data.user.id)
//           .single();

//         if (profile?.role === 'MUSICIAN') {
//           return NextResponse.redirect(`${requestUrl.origin}/musician/dashboard`);
//         } else if (profile?.role === 'CLIENT') {
//           return NextResponse.redirect(`${requestUrl.origin}/client/home`);
//         }
//       }

//       return NextResponse.redirect(`${requestUrl.origin}${next}`);
//     } catch (error) {
//       console.error('❌ Callback error:', error);
//       return NextResponse.redirect(
//         `${requestUrl.origin}/login?error=verification_failed`
//       );
//     }
//   }

//   // No code present, redirect to home
//   return NextResponse.redirect(`${requestUrl.origin}/`);
// }







// // // src/app/auth/callback/route.js
// // import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
// // import { cookies } from 'next/headers';
// // import { NextResponse } from 'next/server';

// // export async function GET(request) {
// //   const requestUrl = new URL(request.url);
// //   const code = requestUrl.searchParams.get('code');

// //   if (code) {
// //     const supabase = createRouteHandlerClient({ cookies });
// //     await supabase.auth.exchangeCodeForSession(code);
// //   }

// //   // URL to redirect to after sign in process completes
// //   return NextResponse.redirect(new URL('/client/home', requestUrl.origin));
// // }


// // // // src/app/auth/callback/route.js
// // // import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
// // // import { cookies } from 'next/headers';
// // // import { NextResponse } from 'next/server';

// // // export async function GET(request) {
// // //   const requestUrl = new URL(request.url);
// // //   const code = requestUrl.searchParams.get('code');

// // //   if (code) {
// // //     const supabase = createRouteHandlerClient({ cookies });
// // //     await supabase.auth.exchangeCodeForSession(code);
// // //   }

// // //   // Redirect to home page after successful OAuth
// // //   return NextResponse.redirect(new URL('/client/home', requestUrl.origin));
// // // }