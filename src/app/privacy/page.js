//src/app/privacy/page.js


"use client";

import { Music, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          <div className="flex items-center gap-3 mb-4">
            <Music className="w-8 h-8" />
            <span className="text-2xl font-bold">AmplyGigs</span>
          </div>
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <p className="text-purple-100 mt-2">Last updated: February 14, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-purple dark:prose-invert max-w-none">

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Welcome to AmplyGigs. We respect your privacy and are committed to protecting your personal data.
              This privacy policy explains how we look after your personal data when you visit our platform
              and outlines your privacy rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Information We Collect</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">We collect the following types of information:</p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li><strong>Personal Information:</strong> Name, email address, phone number, location</li>
              <li><strong>Profile Data:</strong> Display name, bio, genres, photos, videos</li>
              <li><strong>Payment Information:</strong> Processed securely through Paystack and Stripe — we do not store card details</li>
              <li><strong>Usage Data:</strong> How you interact with our platform, pages visited, features used</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
              <li><strong>Voice Data:</strong> When using our AI assistant Amy, voice recordings are processed for transcription only</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>To provide and maintain our booking platform</li>
              <li>To process transactions and send booking notifications</li>
              <li>To improve our AI assistant Amy&apos;s functionality</li>
              <li>To send you marketing communications (with your consent)</li>
              <li>To prevent fraud and enhance security</li>
              <li>To comply with legal obligations under Nigerian law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Data Sharing</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">We do not sell your personal data. We may share your information with:</p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li><strong>Musicians/Clients:</strong> Relevant contact and event details when a booking is made</li>
              <li><strong>Payment Processors:</strong> Paystack and Stripe for secure payment processing</li>
              <li><strong>AI Services:</strong> OpenAI for Amy AI assistant voice transcription and responses</li>
              <li><strong>Analytics Providers:</strong> To understand platform usage and improve services</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect rights and safety</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Platform Fees</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              AmplyGigs charges a platform service fee on completed bookings. This fee is deducted from the
              musician&apos;s payout — clients pay only the agreed gig fee. AmplyGigs operates a contract/gig
              model; no VAT is applied to transactions on this platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Data Security</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">We implement industry-standard security measures including:</p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>SSL encryption for all data transmission</li>
              <li>Secure password hashing (bcrypt)</li>
              <li>Regular security audits</li>
              <li>Role-based access controls</li>
              <li>PCI-DSS compliant payment processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Your Rights (NDPR)</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Under the Nigerian Data Protection Regulation (NDPR), you have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to data processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Cookies</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We use cookies to enhance your experience. You can control cookies through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Children&apos;s Privacy</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Our services are not intended for individuals under 18. We do not knowingly collect data from children.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We may update this policy from time to time. We will notify you of any significant changes
              via email or platform notification.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Contact Us</h2>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-gray-900 dark:text-white font-semibold mb-2">AmplyGigs Privacy Team</p>
              <p className="text-gray-600 dark:text-gray-400">Email: privacy@amplygigs.com</p>
              <p className="text-gray-600 dark:text-gray-400">Address: Lagos, Nigeria</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}