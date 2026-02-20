import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const supabase = createClient();

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get application
    const { data: application } = await supabase
      .from("partner_applications")
      .select("*")
      .eq("id", params.id)
      .single();

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    // Update application status
    const { error: updateError } = await supabase
      .from("partner_applications")
      .update({
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (updateError) throw updateError;

    // Create partner record based on type
    if (application.partner_type === "venue") {
      await createVenuePartnership(supabase, application);
    } else if (
      application.partner_type === "event_manager" ||
      application.partner_type === "record_label"
    ) {
      await createEventManager(supabase, application);
    }

    // TODO: Send approval email to applicant

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error approving application:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function createVenuePartnership(supabase, application) {
  const appData = application.application_data;

  // First, create or get venue
  const { data: venue, error: venueError } = await supabase
    .from("venues")
    .insert({
      name: appData.company_name,
      address: appData.venue_address,
      city: appData.venue_city,
      capacity: parseInt(appData.venue_capacity) || null,
      venue_type: appData.venue_type,
      description: appData.description,
      website: appData.website_url,
      contact_email: appData.primary_contact_email,
      contact_phone: appData.primary_contact_phone,
      is_active: true,
    })
    .select()
    .single();

  if (venueError) throw venueError;

  // Create partnership record
  const { error: partnershipError } = await supabase
    .from("venue_partnerships")
    .insert({
      venue_id: venue.id,
      partnership_tier: "basic",
      commission_rate: 10.0,
      status: "active",
      verification_status: "verified",
      primary_contact_name: appData.primary_contact_name,
      primary_contact_email: appData.primary_contact_email,
      primary_contact_phone: appData.primary_contact_phone,
      business_registration_url: appData.business_registration_number,
      tax_id: appData.tax_id,
    });

  if (partnershipError) throw partnershipError;
}

async function createEventManager(supabase, application) {
  const appData = application.application_data;

  const { error } = await supabase.from("event_managers").insert({
    user_id: application.applicant_user_id,
    company_name: appData.company_name,
    company_type: application.partner_type,
    business_registration_number: appData.business_registration_number,
    tax_id: appData.tax_id,
    primary_contact_name: appData.primary_contact_name,
    primary_contact_email: appData.primary_contact_email,
    primary_contact_phone: appData.primary_contact_phone,
    website_url: appData.website_url,
    status: "active",
    verification_status: "verified",
    verified_at: new Date().toISOString(),
  });

  if (error) throw error;
}