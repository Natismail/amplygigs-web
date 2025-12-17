//src/app/signup/page.js

"use client";

import Image from "next/image";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "CLIENT",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          id: data.user.id,
          email: form.email,
          first_name: form.firstName,
          last_name: form.lastName,
          role: form.role || "CLIENT",
        });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.push("/login");
  }

  async function handleSocialLogin(provider) {
    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
    } catch (err) {
      console.error(err);
      setError("Social login failed. Try again.");
    }
  }

  return (
    <div
      className="h-screen flex flex-col items-center justify-center px-4 bg-cover bg-center bg-no-repeat bg-black/60"
      style={{
        backgroundImage:
          "url('/images/simon-weisser-phS37wg8cQg-unsplash.jpg')",
      }}
    >
      <form
        onSubmit={handleRegister}
        className="p-6 bg-white bg-opacity-80 rounded-lg shadow-xl w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-bold text-center">Sign Up to AmplyGigs</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="text"
          placeholder="First Name"
          className="w-full p-2 border rounded-lg"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          className="w-full p-2 border rounded-lg"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          required
        />
        <select
          className="w-full p-2 border rounded-lg"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="CLIENT">Client</option>
        </select>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded-lg"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full p-2 border rounded-lg"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>

        <div className="mt-4 text-center text-sm text-gray-500">or</div>

        {/* Social Login Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => handleSocialLogin("google")}
            className="flex-1 py-2 border rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100"
          >
            <Image src="/images/google.svg" alt="Google" className="w-5 h-5" width={40} height={40}/>
            Google
          </button>
          <button
            onClick={() => handleSocialLogin("facebook")}
            className="flex-1 py-2 border rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100"
          >
            <Image src="/images/facebook.svg" alt="Facebook" className="w-5 h-5" width={40} height={40}  />
            Facebook
          </button>
        </div>

        <p className="mt-6 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-green-600 font-medium hover:underline">
            Sign In
          </a>
        </p>
      </form>
    </div>
  );
}



// // src/pages/signup/page.js
// "use client";
// import { useState } from "react";
// import { supabase } from "@/lib/supabaseClient";
// import { useRouter } from "next/navigation";

// export default function SignUpPage() {
//   const [form, setForm] = useState({
//     email: "",
//     password: "",
//     firstName: "",
//     lastName: "",
//     role: "CLIENT",
//   });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   async function handleRegister(e) {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     const { data, error: authError } = await supabase.auth.signUp({
//       email: form.email,
//       password: form.password,
//     });

//     if (authError) {
//       setError(authError.message);
//       setLoading(false);
//       return;
//     }

//     if (data.user) {
//       const { error: profileError } = await supabase
//         .from("user_profiles")
//         .insert({
//           id: data.user.id,
//           email: form.email,
//           first_name: form.firstName,
//           last_name: form.lastName,
//           role: form.role || "CLIENT", // Pass the selected role directly
//         });

//       if (profileError) {
//         setError(profileError.message);
//         setLoading(false);
//         return;
//       }
//     }

//     setLoading(false);
//     router.push("/login");
//   }

//   return (
//     <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-300 to-indigo-170 px-4 bg-cover bg-center bg-no-repeat  bg-black/60"
//     style={{ backgroundImage: "url('/images/simon-weisser-phS37wg8cQg-unsplash.jpg')" }}>
//       <form onSubmit={handleRegister} className="p-6 bg-white bg-opacity-80  rounded-lg shadow-xl w-96 space-y-4">
//         <h1 className="text-xl font-bold">SignUp to AmplyGigs</h1>
//         {error && <p className="text-red-500 text-sm">{error}</p>}
//         <input type="text" placeholder="First Name"
//           className="w-full p-2 border rounded-lg"
//           value={form.firstName}
//           onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
//         <input type="text" placeholder="Last Name"
//           className="w-full p-2 border rounded-lg"
//           value={form.lastName}
//           onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
//         <select
//           className="w-full p-2 border rounded-lg"
//           value={form.role}
//           onChange={(e) => setForm({ ...form, role: e.target.value })}
//         >
//           <option value="CLIENT">Client</option>
//           {/* <option value="MUSICIAN">Musician</option> */}
//         </select>
//         <input type="email" placeholder="Email"
//           className="w-full p-2 border rounded-lg"
//           value={form.email}
//           onChange={(e) => setForm({ ...form, email: e.target.value })} />
//         <input type="password" placeholder="Password"
//           className="w-full p-2 border rounded-lg"
//           value={form.password}
//           onChange={(e) => setForm({ ...form, password: e.target.value })} />
//         <button
//           className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
//           disabled={loading}
//         >
//           {loading ? "Signing Up..." : "Sign Up"}
//         </button>
//       </form>
//       <p className="mt-6 text-sm text-center text-gray-600">
//           Already have an account?{" "}
//           <a
//             href="/login"
//                                                                                                                                                                                                         className="text-green-600 font-medium hover:underline"
//           >
//             Sign In
//           </a>
//         </p>
//     </div>
//   );
// }