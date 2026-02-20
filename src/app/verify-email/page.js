"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function VerifyEmailPage() {
  const { signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Get user email from session
    const getEmail = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.email) {
        setEmail(data.session.user.email);
      }
    };
    getEmail();
  }, []);

  const handleResendEmail = async () => {
    if (!email) return;

    setResending(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;

      setMessage('✅ Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Error resending email:', error);
      setMessage('❌ Failed to send email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Icon */}
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
          Verify Your Email
        </h1>

        {/* Description */}
        <div className="text-center mb-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We&apos;ve sent a verification email to:
          </p>
          <p className="font-semibold text-gray-900 dark:text-white mb-4">
            {email || 'your email address'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please check your inbox and click the verification link to continue.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('✅') 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <p className={`text-sm ${
              message.includes('✅')
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            }`}>
              {message}
            </p>
          </div>
        )}

        {/* Resend Button */}
        <button
          onClick={handleResendEmail}
          disabled={resending || !email}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {resending ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="w-5 h-5" />
              Resend Verification Email
            </>
          )}
        </button>

        {/* Tips */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Didn`&apos;`t receive the email?
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li>• Check your spam/junk folder</li>
            <li>• Wait a few minutes for the email to arrive</li>
            <li>• Make sure {email} is correct</li>
            <li>• Click the resend button above</li>
          </ul>
        </div>

        {/* Sign out */}
        <button
          onClick={async () => {
            //await supabase.auth.signOut();
await signOut();
window.location.href = '/login';

            window.location.href = '/login';
          }}
          className="w-full mt-6 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          Sign out and use different email
        </button>
      </div>
    </div>
  );
}