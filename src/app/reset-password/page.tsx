// src/app/reset-password/page.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto mt-24 px-6">
      <div className="bg-surface border border-line rounded-xl p-8">
        <h1 className="font-display font-bold text-2xl mb-1">
          Set a new password
        </h1>
        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-bg-alt border border-line rounded px-3 py-2.5 text-sm focus:outline-none focus:border-ink-faint transition"
            required
          />
          {error && <p className="text-flag text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-tag text-[#1a2015] font-semibold py-2.5 rounded hover:brightness-110 transition disabled:opacity-60"
          >
            {loading ? "Saving..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
