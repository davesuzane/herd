// src/app/forgot-password/page.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      },
    );

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="max-w-sm mx-auto mt-24 px-6">
      <div className="bg-surface border border-line rounded-xl p-8">
        <h1 className="font-display font-bold text-2xl mb-1">
          Reset your password
        </h1>
        <p className="text-sm text-ink-faint mb-6">
          We'll email you a link to set a new one.
        </p>

        {sent ? (
          <p className="text-tag text-sm">Check your inbox for a reset link.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg-alt border border-line rounded px-3 py-2.5 text-sm focus:outline-none focus:border-ink-faint transition"
              required
            />
            {error && <p className="text-flag text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-tag text-[#1a2015] font-semibold py-2.5 rounded hover:brightness-110 transition disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="text-xs text-ink-faint hover:text-ink-dim transition w-full text-center mt-5 block"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
