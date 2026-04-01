// src/lib/supabase/server.js
// FIX: Next.js 15 made cookies() async — must be awaited.
// createClient() is now async, so every API route must do:
//   const supabase = await createClient()

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// ✅ async — required in Next.js 15 because cookies() is now a Promise
export async function createClient() {
  const cookieStore = await cookies(); // ← the one-line fix

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: async (key) => {
          const cookie = cookieStore.get(key);
          return cookie?.value || null;
        },
        setItem: async (key, value) => {
          cookieStore.set(key, value, {
            path:     '/',
            sameSite: 'lax',
            secure:   process.env.NODE_ENV === 'production',
          });
        },
        removeItem: async (key) => {
          cookieStore.delete(key);
        },
      },
    },
  });
}