// src/components/PaymentForm.js
"use client";

import { useState } from "react";

export default function PaymentForm({ onSubmit, booking = {} }) {
  const [email, setEmail] = useState(booking?.clientEmail || "");
  const [amount, setAmount] = useState(booking?.amount || 0);
  const [currency, setCurrency] = useState("NGN");

  const handlePayClick = async () => {
    try {
      // Send a request to your backend API route
      const response = await fetch('/api/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          email,
          currency,
          bookingId: booking.id, // Pass booking ID to identify the transaction
          musicianId: booking.musicianId, // To identify who gets the payout
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Redirect the user to Flutterwave's checkout page
        window.location.href = result.paymentLink;
      } else {
        alert(result.error || "Payment failed to initiate.");
      }
    } catch (error) {
      console.error("Error during payment initiation:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow space-y-4">
      <h2 className="text-xl font-semibold">Confirm Payment</h2>

      <p className="text-sm text-gray-600">
        ⚠️ Note: 10% of the gig fee will be deducted. The musicians payout will be
        held in escrow and released only after the service is confirmed.
      </p>

      <p>
        <strong>Booking:</strong> {booking.event || 'N/A'} <br />
        <strong>Amount:</strong> {amount} {currency}
      </p>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full p-2 border rounded"
        readOnly
      />
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="NGN">NGN (₦)</option>
        <option value="USD">USD ($)</option>
      </select>
      <button
        onClick={handlePayClick}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Pay Now
      </button>
    </div>
  );
}


// // src/components/PaymentForm.js
// "use client";

// import { useState } from "react";
// import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";

// export default function PaymentForm({ onSubmit, booking = {} }) {
//   const [email, setEmail] = useState(booking?.clientEmail || "");
//   const [amount, setAmount] = useState(booking?.amount || 0);
//   const [currency, setCurrency] = useState("NGN");
//   const flutterwavePublicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;

//   const config = {
//     public_key: flutterwavePublicKey,
//     tx_ref: Date.now().toString(),
//     amount: amount,
//     currency: currency,
//     payment_options: "card,banktransfer,ussd",
//     customer: {
//       email: email,
//     },
//     customizations: {
//       title: "Musician Booking Payment",
//       description: "Payment for your gig booking",
//     },
//   };

//   const handleFlutterwavePayment = useFlutterwave(config);

//   return (
//     <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow space-y-4">
//       <h2 className="text-xl font-semibold">Payment Details</h2>
//       <p>
//         <strong>Booking:</strong> {booking.event || "N/A"} <br />
//         <strong>Amount:</strong> {amount} {currency}
//       </p>

//       <input
//         type="email"
//         placeholder="Email"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         className="w-full p-2 border rounded"
//       />
//       <input
//         type="number"
//         placeholder="Amount"
//         value={amount}
//         onChange={(e) => setAmount(e.target.value)}
//         className="w-full p-2 border rounded"
//         readOnly
//       />
//       <select
//         value={currency}
//         onChange={(e) => setCurrency(e.target.value)}
//         className="w-full p-2 border rounded"
//       >
//         <option value="NGN">NGN (₦)</option>
//         <option value="USD">USD ($)</option>
//       </select>
//       <button
//         onClick={() => {
//           handleFlutterwavePayment({
//             callback: (response) => {
//               console.log(response);
//               onSubmit({
//                 transactionRef: response.transaction_id,
//                 amount: amount,
//               });
//               closePaymentModal();
//             },
//             onClose: () => {
//               alert("Payment closed.");
//             },
//           });
//         }}
//         className="bg-green-600 text-white px-4 py-2 rounded"
//       >
//         Pay Now
//       </button>
//     </div>
//   );
// }