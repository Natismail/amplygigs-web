"use client";

import { Music, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <Music className="w-8 h-8" />
            <span className="text-2xl font-bold">AmplyGigs</span>
          </div>
          
          <h1 className="text-4xl font-bold">Terms of Service</h1>
          <p className="text-purple-100 mt-2">Last updated: February 14, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-purple dark:prose-invert max-w-none">
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              By accessing and using AmplyGigs, you accept and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              2. User Accounts
            </h2>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>You must be at least 18 years old to create an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must provide accurate and complete information</li>
              <li>One person or entity may maintain only one account</li>
              <li>You may not transfer your account to another party</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              3. For Musicians
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              As a musician on AmplyGigs, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>Provide accurate information about your services, rates, and availability</li>
              <li>Honor all confirmed bookings unless there are extraordinary circumstances</li>
              <li>Arrive on time and deliver professional services</li>
              <li>Maintain appropriate licenses and insurance as required by law</li>
              <li>Respect client privacy and confidentiality</li>
              <li>Not engage in discriminatory practices</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              4. For Clients
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              As a client on AmplyGigs, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>Provide accurate event details including date, time, location, and requirements</li>
              <li>Honor confirmed bookings and make timely payments</li>
              <li>Provide a safe and appropriate environment for musicians</li>
              <li>Treat musicians with respect and professionalism</li>
              <li>Not request services outside the agreed scope</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              5. Booking and Payments
            </h2>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>All bookings must be made through the AmplyGigs platform</li>
              <li>Platform fees apply to all transactions</li>
              <li>Payments are processed securely through Paystack or Stripe</li>
              <li>Refunds are subject to our cancellation policy</li>
              <li>Musicians are paid after successful event completion</li>
              <li>Disputes must be reported within 7 days of the event</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              6. Cancellation Policy
            </h2>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li><strong>30+ days before event:</strong> Full refund minus processing fees</li>
              <li><strong>14-29 days before event:</strong> 50% refund</li>
              <li><strong>7-13 days before event:</strong> 25% refund</li>
              <li><strong>Less than 7 days:</strong> No refund</li>
              <li>Force majeure exceptions may apply</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              7. Prohibited Activities
            </h2>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>Circumventing the platform to avoid fees</li>
              <li>Posting false or misleading information</li>
              <li>Harassment, discrimination, or abusive behavior</li>
              <li>Unauthorized use of copyrighted content</li>
              <li>Attempting to hack or compromise platform security</li>
              <li>Creating multiple accounts to manipulate ratings</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              8. Intellectual Property
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              All content on AmplyGigs, including logos, designs, and software, is owned by AmplyGigs 
              and protected by copyright laws. Users retain rights to their uploaded content but grant 
              AmplyGigs a license to display and promote it on the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              9. Limitation of Liability
            </h2>
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
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              10. Termination
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We reserve the right to suspend or terminate accounts that violate these terms. 
              Users may close their accounts at any time, subject to completing all pending obligations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              11. Governing Law
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              These terms are governed by the laws of the Federal Republic of Nigeria. 
              Disputes will be resolved in Nigerian courts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              12. Changes to Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We may update these terms from time to time. Continued use of the platform after changes 
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              13. Contact Information
            </h2>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-gray-900 dark:text-white font-semibold mb-2">AmplyGigs Legal Team</p>
              <p className="text-gray-600 dark:text-gray-400">Email: legal@amplygigs.com</p>
              <p className="text-gray-600 dark:text-gray-400">Address: Lagos, Nigeria</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}