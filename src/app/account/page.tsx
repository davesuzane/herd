// src/app/account/page.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleAddEmail(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const { error } = await supabase.auth.updateUser(
      { email },
      {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    );

    if (error) {
      setError(error.message);
      return;
    }
    setMessage(
      "Check your inbox to confirm — your account will switch to email login once confirmed.",
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-24 px-6">
      <div className="bg-surface border border-line rounded-xl p-8">
        <h1 className="font-display font-bold text-2xl mb-1">Add an email</h1>
        <p className="text-sm text-ink-faint mb-6">
          Keeps your account recoverable even if you lose your code.
        </p>
        <form onSubmit={handleAddEmail} className="space-y-3">
          <input
            type="email"
            placeholder="soneca@nenem.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-bg-alt border border-line rounded px-3 py-2.5 text-sm focus:outline-none focus:border-ink-faint transition"
            required
          />
          {error && <p className="text-flag text-xs">{error}</p>}
          {message && <p className="text-tag text-xs">{message}</p>}
          <button
            type="submit"
            className="w-full bg-tag text-[#1a2015] font-semibold py-2.5 rounded hover:brightness-110 transition"
          >
            Send confirmation link
          </button>
        </form>
      </div>
    </div>
  );
}
