// src/components/VerificationGate.js
// Single source of truth for musician verification state.
// Reads from BOTH user_profiles AND musician_verifications (via useKYC).
//
// Admin flow:
//   1. Musician completes steps → musician_verifications.status = 'under_review'
//   2. Admin reviews docs on their dashboard
//   3. Admin sets status = 'approved' + user_profiles.is_verified = true
//   4. VerificationGate unlocks (status = 'verified')
//
// Key design decision:
//   - 'pending_review' musicians CAN accept proposals by default (they did their part)
//   - Set blockPendingReview={true} on the gate if you want to block them too
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, X, AlertTriangle, ShieldX } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useKYC } from "@/hooks/useKYC";

// ── Steps config ──────────────────────────────────────────────────────────
const STEPS = [
  {
    key: "profile_complete",
    label: "Complete your profile",
    description: "Add your bio, role, genres, and a profile photo.",
    href: "/musician/settings",
  },
  {
    key: "email_verified",
    label: "Verify your email",
    description: "Confirm your email address from your inbox.",
    href: "/musician/settings",
  },
  {
    key: "bank_account_added",
    label: "Add a bank account",
    description: "Add at least one bank account to receive payments.",
    href: "/musician/settings/bank-accounts",
  },
  {
    key: "kyc_submitted",
    label: "Submit identity verification",
    description: "Upload your government ID and selfie for review.",
    href: "/musician/verification",
  },
];

// ── Unified hook ──────────────────────────────────────────────────────────
export function useMusicianVerification() {
  const { user } = useAuth();
  // useKYC reads from musician_verifications table
  const { verification, loading: kycLoading, refreshVerification } = useKYC();
  const [profile, setProfile] = useState(null);
  const [bankCount, setBankCount] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfileData = useCallback(async () => {
    if (!user?.id) return;
    setProfileLoading(true);
    try {
      const [{ data: profileData }, { count }] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("is_verified, bio, primary_role, genres, avatar_url, email_verified, role")
          .eq("id", user.id)
          .single(),
        supabase
          .from("musician_bank_accounts")
          .select("*", { count: "exact", head: true })
          .eq("musician_id", user.id)
          .eq("status", "active"),
      ]);
      setProfile(profileData || null);
      setBankCount(count || 0);
    } catch (err) {
      console.error("Verification profile fetch:", err);
    } finally {
      setProfileLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const loading = kycLoading || profileLoading;

  // ── Per-step checks ──────────────────────────────────────────────────────
  const checks = {
    profile_complete: !!(
      profile?.bio &&
      profile?.primary_role &&
      profile?.genres?.length > 0 &&
      profile?.avatar_url
    ),
    email_verified: !!(profile?.email_verified),
    bank_account_added: bankCount > 0,
    // ✅ Musician's job is done once submitted — don't block on admin approval
    kyc_submitted: !!(
      verification?.id_front_image_url ||        // started uploading
      verification?.status === "under_review" ||  // fully submitted
      verification?.status === "approved" ||
      profile?.is_verified
    ),
  };

  // KYC sub-states for nuanced UI messaging
  const kycStatus = {
    notStarted:  !verification || (!verification.id_front_image_url && !verification.selfie_image_url),
    inProgress:  !!(verification?.id_front_image_url && !verification?.selfie_image_url),
    submitted:   !!(verification?.status === "under_review" || verification?.status === "pending"),
    approved:    !!(verification?.status === "approved" || profile?.is_verified),
    rejected:    verification?.status === "rejected",
  };

  const completedCount = Object.values(checks).filter(Boolean).length;
  const totalCount = STEPS.length;

  // ── Overall status ───────────────────────────────────────────────────────
  // 'verified'       → admin approved, fully unlocked
  // 'pending_review' → KYC submitted, awaiting admin (musician did their part)
  // 'unverified'     → steps not complete
  // 'not_musician'   → non-musician role, gate doesn't apply
  const isMusician = !profile || profile?.role === "MUSICIAN"; // default to true while loading
  let status;
  if (!isMusician) {
    status = "not_musician";
  } else if (profile?.is_verified || verification?.status === "approved") {
    status = "verified";
  } else if (kycStatus.submitted || kycStatus.inProgress) {
    status = "pending_review";
  } else {
    status = "unverified";
  }

  const refetch = useCallback(async () => {
    await Promise.all([fetchProfileData(), refreshVerification()]);
  }, [fetchProfileData, refreshVerification]);

  return {
    status,          // 'verified' | 'pending_review' | 'unverified' | 'not_musician'
    checks,          // { profile_complete, email_verified, bank_account_added, kyc_submitted }
    kycStatus,       // { notStarted, inProgress, submitted, approved, rejected }
    profile,
    verification,
    completedCount,
    totalCount,
    loading,
    refetch,
  };
}

// ── Step row ──────────────────────────────────────────────────────────────
function StepRow({ step, done, kycStatus, onNavigate }) {
  let label = step.label;
  let subLabel = null;

  if (step.key === "kyc_submitted" && !done) {
    if (kycStatus.inProgress) {
      label = "Continue ID verification";
      subLabel = "You started but haven't finished yet";
    }
  }
  if (step.key === "kyc_submitted" && done && kycStatus.submitted) {
    label = "Documents under review";
    subLabel = "24–48 hours · no action needed";
  }
  if (step.key === "kyc_submitted" && kycStatus.approved) {
    label = "Identity verified ✓";
  }

  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5
      ${done
        ? "bg-green-50 dark:bg-green-900/10"
        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      }`}
    >
      <span className="text-base flex-shrink-0">{done ? "✅" : "⭕"}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug
          ${done ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"}`}>
          {label}
        </p>
        {subLabel && (
          <p className={`text-xs mt-0.5 ${done ? "text-blue-500" : "text-amber-500"}`}>
            {subLabel}
          </p>
        )}
        {!done && !subLabel && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{step.description}</p>
        )}
      </div>
      {!done && step.key !== "kyc_submitted" || (!done && !kycStatus.submitted) ? (
        <button
          onPointerUp={() => onNavigate(step.href)}
          className="text-purple-600 dark:text-purple-400 text-xs font-semibold flex items-center gap-0.5 flex-shrink-0"
        >
          Go <ChevronRight className="w-3.5 h-3.5" />
        </button>
      ) : null}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────
function ProgressBar({ completed, total, amber = false }) {
  const pct = Math.round((completed / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
        <span>{completed}/{total} steps complete</span>
        <span className={`font-bold ${amber ? "text-amber-600" : "text-purple-600"}`}>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${amber ? "bg-amber-500" : "bg-purple-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── VerificationBanner ────────────────────────────────────────────────────
export function VerificationBanner({ compact = false }) {
  const router = useRouter();
  const { status, checks, kycStatus, completedCount, totalCount, loading } =
    useMusicianVerification();

  if (loading || status === "not_musician" || status === "verified") return null;

  const nextStep = STEPS.find((s) => !checks[s.key]);

  // Pending review — just show an informational notice, not alarming
  if (status === "pending_review") {
    if (compact) return null;
    return (
      <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-4 mb-5">
        <span className="text-2xl flex-shrink-0">🔍</span>
        <div>
          <p className="font-bold text-blue-800 dark:text-blue-300 text-sm">Documents Under Review</p>
          <p className="text-blue-700 dark:text-blue-400 text-sm mt-0.5">
            Our team is reviewing your documents. You'll be notified once approved.
            Typical review time: <strong>24–48 hours</strong>.
          </p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 mb-4">
        <ShieldX className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">
          Complete verification to accept bookings.{" "}
          <button
            onPointerUp={() => router.push(nextStep?.href || "/musician/verification")}
            className="font-bold underline"
          >
            Continue →
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-5 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-amber-900 dark:text-amber-200">Verification Required</h3>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
            Complete these steps to accept proposals and receive payments.
          </p>
        </div>
      </div>

      <ProgressBar completed={completedCount} total={totalCount} amber />

      <div className="mt-4 space-y-2">
        {STEPS.map((step) => (
          <StepRow
            key={step.key}
            step={step}
            done={checks[step.key]}
            kycStatus={kycStatus}
            onNavigate={(href) => router.push(href)}
          />
        ))}
      </div>

      {nextStep && (
        <button
          onPointerUp={() => router.push(nextStep.href)}
          className="w-full mt-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition"
        >
          Continue: {nextStep.label} →
        </button>
      )}
    </div>
  );
}

// ── VerificationGateModal ─────────────────────────────────────────────────
export function VerificationGateModal({ isOpen, onClose, actionLabel = "this action" }) {
  const router = useRouter();
  const { status, checks, kycStatus, completedCount, totalCount } =
    useMusicianVerification();

  if (!isOpen) return null;

  const nextStep = STEPS.find((s) => !checks[s.key]);
  const isPendingReview = status === "pending_review";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-6 py-5 relative ${
          isPendingReview
            ? "bg-gradient-to-r from-blue-500 to-blue-600"
            : "bg-gradient-to-r from-amber-500 to-orange-500"
        }`}>
          <button onPointerUp={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              {isPendingReview
                ? <span className="text-2xl">🔍</span>
                : <ShieldX className="w-7 h-7 text-white" />
              }
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isPendingReview ? "Under Review" : "Verification Required"}
              </h2>
              <p className="text-white/80 text-sm">To {actionLabel}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {isPendingReview ? (
            <>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Your documents are being reviewed. Once our team approves them, you'll
                be able to {actionLabel} immediately.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
                ⏱ Typical review time: <strong>24–48 hours</strong>
              </div>
              <button
                onPointerUp={onClose}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition text-sm"
              >
                Got it
              </button>
            </>
          ) : (
            <>
              <ProgressBar completed={completedCount} total={totalCount} />
              <div className="space-y-2">
                {STEPS.map((step) => (
                  <StepRow
                    key={step.key}
                    step={step}
                    done={checks[step.key]}
                    kycStatus={kycStatus}
                    onNavigate={(href) => { onClose(); router.push(href); }}
                  />
                ))}
              </div>
              <button
                onPointerUp={() => { onClose(); router.push(nextStep?.href || "/musician/verification"); }}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition text-sm"
              >
                Complete Verification →
              </button>
              <button onPointerUp={onClose} className="w-full py-2 text-gray-400 text-sm">
                Not now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Default export: VerificationGate wrapper ──────────────────────────────
export default function VerificationGate({
  children,
  actionLabel = "perform this action",
  onVerified,
  blockPendingReview = false, // set true to also block during admin review period
}) {
  const [showModal, setShowModal] = useState(false);
  const { status, loading } = useMusicianVerification();

  const handleClick = (e) => {
    if (loading) return;

    const blocked =
      status === "unverified" ||
      (blockPendingReview && status === "pending_review");

    if (blocked) {
      e.preventDefault();
      e.stopPropagation();
      setShowModal(true);
      return;
    }

    if (onVerified) onVerified();
  };

  return (
    <>
      <div onClick={handleClick} className="contents">
        {children}
      </div>
      <VerificationGateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        actionLabel={actionLabel}
      />
    </>
  );
}