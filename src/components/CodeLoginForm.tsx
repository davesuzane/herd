// src/components/CodeLoginForm.tsx
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function CodeLoginForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const digits = code.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Enter your full 10-digit code.");
      return;
    }

    setLoading(true);
    const email = `guest-${digits}@guest.sulladeal.internal`;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: digits,
    });
    setLoading(false);

    if (error) {
      setError("That code doesn't match an account.");
      return;
    }

    const redirect = searchParams.get("redirect");
    router.replace(
      redirect && redirect.startsWith("/") && !redirect.startsWith("//")
        ? redirect
        : "/",
    );
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="10-digit code"
        maxLength={10}
        className="w-full bg-bg-alt border border-line rounded px-3 py-2.5 text-sm font-mono tracking-widest text-center focus:outline-none focus:border-ink-faint transition"
        required
      />
      {error && <p className="text-flag text-xs">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-tag text-[#1a2015] font-semibold py-2.5 rounded hover:brightness-110 transition disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in with code"}
      </button>
    </form>
  );
}
