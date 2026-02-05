// src/lib/supabaseAdmin.js - Admin client that bypasses RLS
import { createClient } from '@supabase/supabase-js';

// ⚠️ IMPORTANT: This uses the SERVICE_ROLE key which bypasses ALL RLS policies
// Only use this in server-side code or admin routes that verify admin status first!

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for admin client');
}

// Create admin client with service_role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to verify admin status before using admin client
export async function verifyAdmin(userId) {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('is_admin, role')
    .eq('id', userId)
    .single();

  if (error || (!data?.is_admin && data?.role !== 'ADMIN')) {
    throw new Error('Unauthorized: Admin access required');
  }

  return data;
}