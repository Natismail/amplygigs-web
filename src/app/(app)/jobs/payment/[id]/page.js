"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { getCurrencyByCode, formatCurrency } from "@/components/CurrencySelector";

import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Loader,
  ArrowLeft,
  DollarSign,
  Briefcase,
  Shield
} from 'lucide-react';

export default function JobPaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const POSTING_FEE = 10000; // ₦10,000
  const LISTING_DAYS = 30;

  useEffect(() => {
    if (id && user) {
      fetchJobDetails();
    }
  }, [id, user]);

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Verify ownership
      if (data.posted_by !== user.id) {
        setError('You do not have permission to access this page');
        return;
      }

      // Check if already paid
      if (data.posting_fee_paid) {
        router.push(`/jobs/${id}?payment=success`);
        return;
      }

      setJob(data);
    } catch (err) {
      console.error('Error fetching job:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (!window.PaystackPop) {
      alert('Payment service not loaded. Please refresh the page.');
      return;
    }

    const reference = `JOB_${id}_${Date.now()}`;

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: POSTING_FEE * 100, // Convert to kobo
      currency: 'NGN',
      ref: reference,
      metadata: {
        custom_fields: [
          {
            display_name: "Job Posting ID",
            variable_name: "job_posting_id",
            value: id
          },
          {
            display_name: "Payment Type",
            variable_name: "payment_type",
            value: "job_posting_fee"
          },
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: user.id
          }
        ]
      },
      onClose: function() {
        console.log('Payment window closed');
        setProcessing(false);
      },
      callback: async function(response) {
        console.log('✅ Payment successful:', response.reference);
        setProcessing(true);

        try {
          // ⭐ SECURE: Verify on backend
          const verifyResponse = await fetch('/api/jobs/verify-job-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              reference: response.reference,
              jobId: id
            })
          });

          const result = await verifyResponse.json();

          if (result.success) {
            console.log('✅ Verification successful');
            // Redirect to success page
            router.push(`/jobs/${id}?payment=success`);
          } else {
            throw new Error(result.error || 'Verification failed');
          }
        } catch (err) {
          console.error('❌ Verification error:', err);
          setError('Payment successful but verification failed. Please contact support with reference: ' + response.reference);
          setProcessing(false);
        }
      }
    });

    handler.openIframe();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
              Error
            </h2>
            <p className="text-red-800 dark:text-red-200 mb-4">{error}</p>
            <button
              onClick={() => router.push('/client/job-postings')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-purple-700">
        <div className="max-w-2xl mx-auto px-4 py-6 text-white">
          <button
            onClick={() => router.back()}
            className="mb-3 text-white hover:text-purple-100 flex items-center gap-2"
            disabled={processing}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Briefcase className="w-7 h-7" />
            Complete Job Posting
          </h1>
          <p className="text-purple-100 text-sm flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Secure Paystack payment • Verified by backend
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        
        {/* Job Summary Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Job Posting Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Title:</span>
              <span className="font-medium text-gray-900 dark:text-white text-right">
                {job.title}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {job.job_type}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Location:</span>
              <span className="font-medium text-gray-900 dark:text-white text-right">
                {job.location}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Salary Range:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(job.salary_min || 0, job.currency || 'NGN')} - {formatCurrency(job.salary_max || 0, job.currency || 'NGN') || 'Open'}
              </span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
          <div className="flex gap-3">
            <Shield className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-green-900 dark:text-green-100 mb-1">
                Secure Payment Verification
              </h4>
              <p className="text-sm text-green-800 dark:text-green-200">
                Your payment is verified securely on our backend servers using Paystack's API. 
                No frontend manipulation is possible.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>💰</span> Payment Breakdown
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between text-base">
              <span className="text-gray-700 dark:text-gray-300">Job Posting Fee ({LISTING_DAYS} days)</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ₦{POSTING_FEE.toLocaleString()}
              </span>
            </div>
            
            <div className="pt-4 border-t-2 border-blue-300 dark:border-blue-600">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 dark:text-white">Total Amount</span>
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ₦{POSTING_FEE.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* What's Included */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            What's Included ✓
          </h3>
          <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>{LISTING_DAYS} days of active listing visibility</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Unlimited musician applications</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Application management dashboard</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Secure backend payment verification</span>
            </li>
          </ul>
        </div>

        {/* Payment Button */}
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 -mx-4">
          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full min-h-[56px] bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader className="w-6 h-6 animate-spin" />
                <span>Verifying Payment...</span>
              </>
            ) : (
              <>
                <DollarSign className="w-6 h-6" />
                <span>Pay ₦{POSTING_FEE.toLocaleString()} Securely</span>
              </>
            )}
          </button>
          
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center justify-center gap-1">
            <span>🔐</span> Powered by Paystack • Backend Verified • 256-bit Encrypted
          </p>
        </div>
      </div>
    </div>
  );
}