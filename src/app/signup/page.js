// src/pages/signup/page.js
"use client";
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
          role: form.role || "CLIENT", // Pass the selected role directly
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

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-300 to-indigo-170 px-4 bg-cover bg-center bg-no-repeat  bg-black/60"
    style={{ backgroundImage: "url('/images/simon-weisser-phS37wg8cQg-unsplash.jpg')" }}>
      <form onSubmit={handleRegister} className="p-6 bg-white bg-opacity-80  rounded-lg shadow-xl w-96 space-y-4">
        <h1 className="text-xl font-bold">SignUp to AmplyGigs</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input type="text" placeholder="First Name"
          className="w-full p-2 border rounded-lg"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input type="text" placeholder="Last Name"
          className="w-full p-2 border rounded-lg"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        <select
          className="w-full p-2 border rounded-lg"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="CLIENT">Client</option>
          {/* <option value="MUSICIAN">Musician</option> */}
        </select>
        <input type="email" placeholder="Email"
          className="w-full p-2 border rounded-lg"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Password"
          className="w-full p-2 border rounded-lg"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button
          className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
          disabled={loading}
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      </form>
      <p className="mt-6 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <a
            href="/login"
                                                                                                                                                                                                        className="text-green-600 font-medium hover:underline"
          >
            Sign In
          </a>
        </p>
    </div>
  );
}