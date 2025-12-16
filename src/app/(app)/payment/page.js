"use client";

import { useState } from "react";

export default function PaymentScreen() {
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handlePayment(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // TODO: Replace with real Flutterwave or Paystack integration
      // Example:
      // const response = await fetch("/api/paystack/initialize", { method: "POST", body: JSON.stringify({ amount, email }) })
      // const data = await response.json();
      // redirect to payment gateway checkout URL

      setTimeout(() => {
        setMessage("Payment flow placeholder - integrate Paystack/Flutterwave here.");
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessage("Payment failed: " + error.message);
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Payment</h1>
      {message && <p className="mb-4 text-green-600">{message}</p>}

      <form onSubmit={handlePayment} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full rounded"
          required
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 w-full rounded"
          required
        />
        <button
          type="submit"
          className={`w-full bg-green-600 text-white px-4 py-2 rounded ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={loading}
        >
          {loading ? "Processing..." : "Pay"}
        </button>
      </form>
    </div>
  );
}



// export default function PaymentScreen() {
//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold">Payment</h1>
//       <form className="space-y-4">
//         <input type="text" placeholder="Card Number" className="border p-2 w-full rounded" />
//         <input type="text" placeholder="Expiry Date" className="border p-2 w-full rounded" />
//         <input type="text" placeholder="CVC" className="border p-2 w-full rounded" />
//         <button className="bg-green-600 text-white px-4 py-2 rounded">Pay</button>
//       </form>
//     </div>
//   );
// }
