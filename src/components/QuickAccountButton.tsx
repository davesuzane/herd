// src/components/QuickAccountButton.tsx
"use client";
import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function QuickAccountButton() {
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleVerified(token: string) {
    setLoading(true);
    setError("");

    const res = await fetch("/api/quick-account", {
      method: "POST",
      body: JSON.stringify({ turnstileToken: token }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Something went wrong.");
      setShowCaptcha(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.code,
    });
    setLoading(false);

    if (signInError) {
      setError(
        'Account created, but sign-in failed — try "Log in with a code" using the code below.',
      );
    }
    setCode(data.code);
  }

  async function copyCode() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (code) {
    return (
      <div className="bg-surface border border-tag rounded-xl p-6 text-center">
        <p className="text-sm text-ink-dim mb-3">
          Account ready. This code is the only way back in — save it somewhere
          safe:
        </p>
        <div className="font-mono text-2xl tracking-widest bg-bg-alt border border-line rounded-lg py-4 mb-3">
          {code}
        </div>
        <button
          onClick={copyCode}
          className="text-xs font-mono px-4 py-2 rounded-full border border-tag/40 text-tag hover:bg-tag/10 transition mb-4"
        >
          {copied ? "Copied ✓" : "Copy code"}
        </button>
        <p className="text-xs text-ink-faint mb-4">
          Want it recoverable by email too? Add one anytime from your account
          settings.
        </p>
        <button
          onClick={() => router.push("/")}
          className="w-full bg-tag text-[#1a2015] font-semibold py-2.5 rounded hover:brightness-110 transition"
        >
          Continue to Herd
        </button>
      </div>
    );
  }

  return (
    <div>
      {!showCaptcha ? (
        <button
          onClick={() => setShowCaptcha(true)}
          className="w-full border border-tag/40 text-tag font-semibold py-2.5 rounded hover:bg-tag/10 transition"
        >
          ⚡ Quick Access — no email needed
        </button>
      ) : (
        <div className="mt-3 flex flex-col items-center gap-2">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={handleVerified}
          />
          {loading && (
            <p className="text-xs text-ink-faint">Creating your account…</p>
          )}
        </div>
      )}
      {error && <p className="text-flag text-xs mt-2">{error}</p>}
    </div>
  );
}
