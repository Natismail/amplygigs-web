"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function BankAccountsPage() {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    bank_name: "",
    account_number: "",
    account_name: "",
  });

  useEffect(() => {
    if (!user) return;

    supabase
      .from("bank_accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAccounts(data || []);
        setLoading(false);
      });
  }, [user]);

  async function addAccount(e) {
    e.preventDefault();

    const { error } = await supabase.from("bank_accounts").insert({
      user_id: user.id,
      ...form,
    });

    if (!error) {
      setForm({ bank_name: "", account_number: "", account_name: "" });
      location.reload();
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">Bank Accounts</h1>

      {/* Existing Accounts */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-4 rounded-lg border bg-white dark:bg-gray-900"
            >
              <p className="font-medium">{acc.bank_name}</p>
              <p className="text-sm text-gray-500">
                {acc.account_name} • ****{acc.account_number.slice(-4)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Account */}
      <form
        onSubmit={addAccount}
        className="p-4 border rounded-xl space-y-3"
      >
        <h2 className="font-semibold">Add Bank Account</h2>

        <input
          required
          placeholder="Bank Name"
          className="input"
          value={form.bank_name}
          onChange={(e) =>
            setForm({ ...form, bank_name: e.target.value })
          }
        />

        <input
          required
          placeholder="Account Number"
          className="input"
          value={form.account_number}
          onChange={(e) =>
            setForm({ ...form, account_number: e.target.value })
          }
        />

        <input
          required
          placeholder="Account Holder Name"
          className="input"
          value={form.account_name}
          onChange={(e) =>
            setForm({ ...form, account_name: e.target.value })
          }
        />

        <button className="btn-primary w-full">
          Add Account
        </button>
      </form>
    </div>
  );
}
