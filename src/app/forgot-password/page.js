"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) setError(error.message);
    else setMessage("Check your email for password reset instructions.");

    setLoading(false);
  };

  return (
    <div
      className="h-screen flex flex-col items-center justify-center px-4 bg-cover bg-center bg-no-repeat bg-black/60"
      style={{
        backgroundImage:
          "url('/images/simon-weisser-phS37wg8cQg-unsplash.jpg')",
      }}
    >
      <div className="max-w-sm p-8 bg-white bg-opacity-80 rounded-lg w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Forgot Password
        </h1>
        {error && (
          <p className="bg-red-100 text-red-600 px-3 py-2 rounded-md mb-4 text-sm">
            {error}
          </p>
        )}
        {message && (
          <p className="bg-green-100 text-green-700 px-3 py-2 rounded-md mb-4 text-sm">
            {message}
          </p>
        )}
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full p-2 border rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <p className="mt-6 text-sm text-center text-gray-600">
          Remember your password?{" "}
          <a href="/login" className="text-purple-600 hover:underline font-medium">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}



// "use client";
// import { useState } from "react";
// import { supabase } from "@/lib/supabaseClient";
// import { useRouter } from "next/navigation";

// export default function ForgotPasswordPage() {
//   const [email, setEmail] = useState("");
//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");
//   const router = useRouter();

//   const handleReset = async (e) => {
//     e.preventDefault();
//     setError("");
//     setMessage("");

//     const { error } = await supabase.auth.resetPasswordForEmail(email, {
//       redirectTo: `${window.location.origin}/reset-password`,
//     });

//     if (error) setError(error.message);
//     else setMessage("Password reset link sent. Check your email.");
//   };

//   return (
//     <div
//       className="h-screen flex items-center justify-center px-4 bg-cover bg-center"
//       style={{ backgroundImage: "url('/images/simon-weisser-phS37wg8cQg-unsplash.jpg')" }}
//     >
//       <div className="w-full max-w-sm bg-white/80 p-6 rounded-lg shadow-lg">
//         <h1 className="text-xl font-bold text-center mb-4">Forgot Password</h1>

//         {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
//         {message && <p className="text-green-600 text-sm mb-3">{message}</p>}

//         <form onSubmit={handleReset} className="space-y-4">
//           <input
//             type="email"
//             placeholder="Enter your email"
//             className="w-full px-4 py-2 border rounded-lg"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//           />

//           <button className="w-full bg-purple-600 text-white py-2 rounded-lg">
//             Send Reset Link
//           </button>
//         </form>

//         <button
//           onClick={() => router.push("/login")}
//           className="mt-4 text-sm text-purple-600 underline w-full text-center"
//         >
//           Back to login
//         </button>
//       </div>
//     </div>
//   );
// }
