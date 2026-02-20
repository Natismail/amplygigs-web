import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, verifyPaystackSignature } from "@/lib/security";
//import { verifyStripeSignature } from "@/lib/security";
import { NextResponse } from "next/server";

/**
 * Verify user authentication
 */
export async function requireAuth(request) {
  const supabase = createClient();
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return { user };
}

/**
 * Verify admin role
 */
export async function requireAdmin(request) {
  const { user, error } = await requireAuth(request);
  if (error) return { error };

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_admin, role")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin && profile?.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { user, profile };
}

/**
 * Rate limiting middleware
 */
export async function withRateLimit(request, identifier = "global") {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const key = `${identifier}-${ip}`;

  if (!checkRateLimit(key, 100, 60000)) {
    return {
      error: NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 }
      ),
    };
  }

  return { success: true };
}

/**
 * Verify Paystack webhook
 */
export async function verifyPaystackWebhook(request) {
  const signature = request.headers.get("x-paystack-signature");
  const body = await request.json();

  if (!signature || !verifyPaystackSignature(body, signature)) {
    return {
      error: NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 }
      ),
    };
  }

  return { body };
}


/**
 * Verify Paystack webhook
 */
// export async function verifyStripeWebhook(request) {
//   const signature = request.headers.get("x-stripe-signature");
//   const body = await request.json();

//   if (!signature || !verifyStripeSignature(body, signature)) {
//     return {
//       error: NextResponse.json(
//         { success: false, error: "Invalid signature" },
//         { status: 401 }
//       ),
//     };
//   }

//   return { body };
// }
