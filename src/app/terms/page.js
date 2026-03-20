// src/app/terms/page.js
//
// ✅ NO "use client" — intentionally a Server Component.
// Same reason as privacy/page.js — see that file for full explanation.
// Google OAuth bot cannot execute JS, so "use client" pages appear empty to it.

import Link from "next/link";
import { Music, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service — AmplyGigs",
  description: "Terms and conditions governing your use of the AmplyGigs platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Music className="w-8 h-8" />
            <span className="text-2xl font-bold">AmplyGigs</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">Terms of Service</h1>
          <p className="text-purple-100 mt-2">Last updated: February 14, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">

          <Section title="1. Acceptance of Terms">
            <p className="text-gray-600 dark:text-gray-400">
              By accessing and using AmplyGigs, you accept and agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our platform.
            </p>
          </Section>

          <Section title="2. User Accounts">
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>You must be at least 18 years old to create an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must provide accurate and complete information</li>
              <li>One person or entity may maintain only one account</li>
              <li>You may not transfer your account to another party</li>
            </ul>
          </Section>

          <Section title="3. For Musicians">
            <p className="text-gray-600 dark:text-gray-400 mb-4">As a musician on AmplyGigs, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>Provide accurate information about your services, rates, and availability</li>
              <li>Honor all confirmed bookings unless there are extraordinary circumstances</li>
              <li>Arrive on time and deliver professional services</li>
              <li>Maintain appropriate licenses and insurance as required by law</li>
              <li>Respect client privacy and confidentiality</li>
              <li>Not engage in discriminatory practices</li>
            </ul>
          </Section>

          <Section title="4. For Clients">
            <p className="text-gray-600 dark:text-gray-400 mb-4">As a client on AmplyGigs, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>Provide accurate event details including date, time, location, and requirements</li>
              <li>Honor confirmed bookings and make timely payments</li>
              <li>Provide a safe and appropriate environment for musicians</li>
              <li>Treat musicians with respect and professionalism</li>
              <li>Not request services outside the agreed scope</li>
            </ul>
          </Section>

          <Section title="5. Booking and Payments">
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>All bookings must be made through the AmplyGigs platform</li>
              <li>A platform service fee is charged on each completed booking and deducted from the musician&apos;s payout</li>
              <li>Clients pay the agreed gig fee only — no additional fees are added to the client total</li>
              <li>No VAT is applied to transactions — AmplyGigs operates a contract/gig model, not an employment model</li>
              <li>Payments are processed securely through Paystack or Stripe</li>
              <li>Refunds are subject to our cancellation policy</li>
              <li>Musicians are paid after successful event completion and fund release</li>
              <li>Disputes must be reported within 7 days of the event</li>
            </ul>
          </Section>

          <Section title="6. Cancellation Policy">
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li><strong>30+ days before event:</strong> Full refund minus processing fees</li>
              <li><strong>14–29 days before event:</strong> 50% refund</li>
              <li><strong>7–13 days before event:</strong> 25% refund</li>
              <li><strong>Less than 7 days:</strong> No refund</li>
              <li>Force majeure exceptions may apply</li>
            </ul>
          </Section>

          <Section title="7. Prohibited Activities">
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>Circumventing the platform to avoid fees</li>
              <li>Posting false or misleading information</li>
              <li>Harassment, discrimination, or abusive behaviour</li>
              <li>Unauthorized use of copyrighted content</li>
              <li>Attempting to hack or compromise platform security</li>
              <li>Creating multiple accounts to manipulate ratings</li>
            </ul>
          </Section>

          <Section title="8. Intellectual Property">
            <p className="text-gray-600 dark:text-gray-400">
              All content on AmplyGigs, including logos, designs, and software, is owned by AmplyGigs
              and protected by copyright laws. Users retain rights to their uploaded content but grant
              AmplyGigs a licence to display and promote it on the platform.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              AmplyGigs acts as a platform connecting musicians and clients. We are not responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>Quality of services provided by musicians</li>
              <li>Disputes between users</li>
              <li>Lost opportunities or revenues</li>
              <li>Indirect or consequential damages</li>
              <li>Force majeure events</li>
            </ul>
          </Section>

          <Section title="10. Termination">
            <p className="text-gray-600 dark:text-gray-400">
              We reserve the right to suspend or terminate accounts that violate these terms.
              Users may close their accounts at any time, subject to completing all pending obligations.
            </p>
          </Section>

          <Section title="11. Governing Law">
            <p className="text-gray-600 dark:text-gray-400">
              These terms are governed by the laws of the Federal Republic of Nigeria.
              Disputes will be resolved in Nigerian courts.
            </p>
          </Section>

          <Section title="12. Changes to Terms">
            <p className="text-gray-600 dark:text-gray-400">
              We may update these terms from time to time. Continued use of the platform after changes
              constitutes acceptance of the new terms.
            </p>
          </Section>

          <Section title="13. Contact Information">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-gray-900 dark:text-white font-semibold mb-2">AmplyGigs Legal Team</p>
              <p className="text-gray-600 dark:text-gray-400">Email: legal@amplygigs.com</p>
              <p className="text-gray-600 dark:text-gray-400">Address: Lagos, Nigeria</p>
            </div>
          </Section>

        </div>
      </div>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <p>© 2026 AmplyGigs. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-purple-600 transition">Privacy Policy</Link>
            <Link href="/terms"   className="text-purple-600 font-medium">Terms of Service</Link>
            <Link href="/"        className="hover:text-purple-600 transition">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
      {children}
    </section>
  );
}