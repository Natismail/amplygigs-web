import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  console.log('🔐 Auth callback:', { code: !!code, error, errorDescription });

  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });

    try {
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('❌ Error exchanging code:', exchangeError);
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=${encodeURIComponent(exchangeError.message)}`
        );
      }

      console.log('✅ Email verified successfully');

      // Redirect to dashboard based on role
      if (data?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile?.role === 'MUSICIAN') {
          return NextResponse.redirect(`${requestUrl.origin}/musician/dashboard`);
        } else if (profile?.role === 'CLIENT') {
          return NextResponse.redirect(`${requestUrl.origin}/client/home`);
        }
      }

      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    } catch (error) {
      console.error('❌ Callback error:', error);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=verification_failed`
      );
    }
  }

  // No code present, redirect to home
  return NextResponse.redirect(`${requestUrl.origin}/`);
}







// // src/app/auth/callback/route.js
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
// import { cookies } from 'next/headers';
// import { NextResponse } from 'next/server';

// export async function GET(request) {
//   const requestUrl = new URL(request.url);
//   const code = requestUrl.searchParams.get('code');

//   if (code) {
//     const supabase = createRouteHandlerClient({ cookies });
//     await supabase.auth.exchangeCodeForSession(code);
//   }

//   // URL to redirect to after sign in process completes
//   return NextResponse.redirect(new URL('/client/home', requestUrl.origin));
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

// //   // Redirect to home page after successful OAuth
// //   return NextResponse.redirect(new URL('/client/home', requestUrl.origin));
// // }