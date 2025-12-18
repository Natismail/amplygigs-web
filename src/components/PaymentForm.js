import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from "next/navigation";

const PLATFORM_FEE_PERCENTAGE = 5;

export default function MobilePaymentForm({ booking, onPaymentSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentProvider, setPaymentProvider] = useState('paystack');
  
  const gigFee = booking.amount || 0;
  const platformFee = gigFee * (PLATFORM_FEE_PERCENTAGE / 100);
  const totalAmount = gigFee;
  const musicianReceives = gigFee - platformFee;

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pay-paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          email: user.email,
          bookingId: booking.id,
          musicianId: booking.musician_id,
          paymentProvider: paymentProvider
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        router.push = result.paymentLink;
      } else {
        setError(result.error || 'Payment initiation failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-purple-700 safe-top">
        <div className="px-4 py-6 text-white">
          <h1 className="text-2xl font-bold mb-1">Confirm Payment</h1>
          <p className="text-purple-100 text-sm">Secure escrow payment</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Booking Summary Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Booking Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Event</span>
              <span className="font-medium text-gray-900 dark:text-white text-right">
                {booking.event_name || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Musician</span>
              <span className="font-medium text-gray-900 dark:text-white text-right">
                {booking.musician_name || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Date</span>
              <span className="font-medium text-gray-900 dark:text-white text-right">
                {booking.event_date ? new Date(booking.event_date).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span>💰</span> Payment Breakdown
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-base">
              <span className="text-gray-700 dark:text-gray-300">Gig Fee</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ₦{gigFee.toLocaleString()}
              </span>
            </div>

            {/* Platform Fee Card */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-lg">ℹ️</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                    Platform Service Fee ({PLATFORM_FEE_PERCENTAGE}%)
                  </p>
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    Helps maintain secure payments & support
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-yellow-200 dark:border-yellow-700">
                <span className="text-xs text-yellow-700 dark:text-yellow-300">Fee Amount</span>
                <span className="text-sm font-bold text-red-600">
                  -₦{platformFee.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-gray-300 dark:border-gray-600">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-900 dark:text-white">Total to Pay</span>
                <span className="text-2xl font-bold text-purple-600">
                  ₦{totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">Musician receives</span>
                <span className="font-medium text-green-600">₦{musicianReceives.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentProvider('paystack')}
              className={`min-h-[72px] rounded-2xl border-2 transition-all ${
                paymentProvider === 'paystack'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="p-3 text-center">
                <div className="font-bold text-gray-900 dark:text-white">Paystack</div>
                <div className="text-xs text-gray-500 mt-1">Recommended</div>
              </div>
            </button>
            <button
              onClick={() => setPaymentProvider('flutterwave')}
              className={`min-h-[72px] rounded-2xl border-2 transition-all ${
                paymentProvider === 'flutterwave'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="p-3 text-center">
                <div className="font-bold text-gray-900 dark:text-white">Flutterwave</div>
                <div className="text-xs text-gray-500 mt-1">Alternative</div>
              </div>
            </button>
          </div>
        </div>

        {/* Escrow Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4">
          <div className="flex gap-3">
            <span className="text-2xl">🔒</span>
            <div className="flex-1">
              <h4 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                Secure Escrow
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Funds held safely until you confirm the service is complete.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex gap-2">
              <span className="text-red-600">⚠️</span>
              <p className="text-sm text-red-800 flex-1">{error}</p>
            </div>
          </div>
        )}

        {/* Payment Button - Fixed at bottom on mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-bottom">
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full min-h-[56px] bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-purple-800 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Processing...
              </span>
            ) : (
              <span>Pay ₦{totalAmount.toLocaleString()}</span>
            )}
          </button>
          
          {/* Security Badge */}
          <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
            <span>🔐</span> Encrypted & Secure
          </p>
        </div>
      </div>

      {/* Spacer for fixed button */}
      <div className="h-32"></div>
    </div>
  );
}




// import { useState } from 'react';
// import { useAuth } from '@/context/AuthContext';

// export default function ImprovedPaymentForm({ booking, onPaymentSuccess }) {
//   const { user } = useAuth();
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
  
//   const platformFee = booking.amount * 0.10;
//   const musicianReceives = booking.amount - platformFee;

//   const handlePayment = async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await fetch('/api/pay', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           amount: booking.amount,
//           email: user.email,
//           currency: 'NGN',
//           bookingId: booking.id,
//           musicianId: booking.musician_id,
//         }),
//       });

//       const result = await response.json();

//       if (response.ok && result.success) {
//         // Redirect to Flutterwave payment page
//         router.push = result.paymentLink;
//       } else {
//         setError(result.error || 'Payment initiation failed');
//       }
//     } catch (err) {
//       console.error('Payment error:', err);
//       setError('An unexpected error occurred. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-2xl mx-auto p-6">
//       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
//           <h2 className="text-2xl font-bold mb-2">Confirm Payment</h2>
//           <p className="text-purple-100 text-sm">
//             Secure payment powered by Flutterwave
//           </p>
//         </div>

//         {/* Booking Details */}
//         <div className="p-6 space-y-4">
//           <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
//             <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
//               Booking Details
//             </h3>
//             <div className="space-y-2 text-sm">
//               <div className="flex justify-between">
//                 <span className="text-gray-600 dark:text-gray-400">Event:</span>
//                 <span className="font-medium text-gray-900 dark:text-white">
//                   {booking.event_name || 'N/A'}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600 dark:text-gray-400">Musician:</span>
//                 <span className="font-medium text-gray-900 dark:text-white">
//                   {booking.musician_name || 'N/A'}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-gray-600 dark:text-gray-400">Date:</span>
//                 <span className="font-medium text-gray-900 dark:text-white">
//                   {booking.event_date ? new Date(booking.event_date).toLocaleDateString() : 'N/A'}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Payment Breakdown */}
//           <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
//             <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
//               Payment Breakdown
//             </h3>
//             <div className="space-y-2">
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-600 dark:text-gray-400">Gig Fee:</span>
//                 <span className="font-medium text-gray-900 dark:text-white">
//                   ₦{booking.amount.toLocaleString()}
//                 </span>
//               </div>
//               <div className="flex justify-between text-sm">
//                 <span className="text-gray-600 dark:text-gray-400">Platform Fee (10%):</span>
//                 <span className="font-medium text-red-600">
//                   -₦{platformFee.toLocaleString()}
//                 </span>
//               </div>
//               <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
//                 <div className="flex justify-between">
//                   <span className="font-semibold text-gray-900 dark:text-white">
//                     Total to Pay:
//                   </span>
//                   <span className="font-bold text-xl text-purple-600">
//                     ₦{booking.amount.toLocaleString()}
//                   </span>
//                 </div>
//               </div>
//               <div className="flex justify-between text-sm pt-2">
//                 <span className="text-gray-600 dark:text-gray-400">
//                   Musician Receives (in ledger):
//                 </span>
//                 <span className="font-medium text-green-600">
//                   ₦{musicianReceives.toLocaleString()}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Escrow Notice */}
//           <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
//             <div className="flex gap-3">
//               <span className="text-2xl">🔒</span>
//               <div className="flex-1">
//                 <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
//                   Secure Escrow Payment
//                 </h4>
//                 <p className="text-sm text-yellow-800 dark:text-yellow-200">
//                   Your payment will be held securely in escrow and shown in the musician&apos;s
//                   <strong> ledger balance</strong>. Funds will be released to their{' '}
//                   <strong>available balance</strong> only after you confirm the event is completed
//                   successfully.
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Error Message */}
//           {error && (
//             <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//               <div className="flex gap-2">
//                 <span className="text-red-600">⚠️</span>
//                 <p className="text-sm text-red-800">{error}</p>
//               </div>
//             </div>
//           )}

//           {/* Payment Button */}
//           <button
//             onClick={handlePayment}
//             disabled={loading}
//             className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
//           >
//             {loading ? (
//               <span className="flex items-center justify-center gap-2">
//                 <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
//                 Processing...
//               </span>
//             ) : (
//               <span className="flex items-center justify-center gap-2">
//                 <span>💳</span>
//                 Pay ₦{booking.amount.toLocaleString()} Now
//               </span>
//             )}
//           </button>

//           {/* Security Notice */}
//           <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
//             <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
//               <span>🔐</span>
//               Secured by Flutterwave • Your payment information is encrypted
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* How It Works */}
//       <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
//         <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
//           <span>📋</span>
//           How Payment Works
//         </h3>
//         <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
//           <li className="flex gap-3">
//             <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xs">
//               1
//             </span>
//             <span>You pay the total amount securely through Flutterwave</span>
//           </li>
//           <li className="flex gap-3">
//             <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xs">
//               2
//             </span>
//             <span>
//               90% goes to the musician&apos;s <strong>ledger balance</strong>, 10% platform fee
//             </span>
//           </li>
//           <li className="flex gap-3">
//             <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xs">
//               3
//             </span>
//             <span>After the event, you confirm completion in your bookings</span>
//           </li>
//           <li className="flex gap-3">
//             <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xs">
//               4
//             </span>
//             <span>
//               Funds move from ledger to <strong>available balance</strong> for the musician to
//               withdraw
//             </span>
//           </li>
//         </ol>
//       </div>
//     </div>
//   );
// }