// src/components/AuthForm.tsx
"use client";
import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function getAuthErrorMessage(errorMessage: string) {
  const m = errorMessage.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Incorrect email or password.";
  if (m.includes("email not confirmed"))
    return "Please confirm your email before signing in.";
  if (m.includes("user already registered"))
    return "An account with this email already exists.";
  if (m.includes("password should be at least"))
    return "Your password is too short.";
  if (m.includes("rate limit"))
    return "Too many requests. Please wait a little before trying again.";
  return errorMessage;
}

export default function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignIn = mode === "signin";

  function getSafeRedirect() {
    const redirect = searchParams.get("redirect");
    if (redirect && redirect.startsWith("/") && !redirect.startsWith("//"))
      return redirect;
    return "/";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    if (!isSignIn && password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = isSignIn
        ? await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          })
        : await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
            },
          });

      if (result.error) {
        setError(getAuthErrorMessage(result.error.message));
        return;
      }

      if (!isSignIn && !result.data.session) {
        setMessage(
          "Account created! Check your email to confirm your account.",
        );
        return;
      }

      router.replace(getSafeRedirect());
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const redirectParam = searchParams.get("redirect");
  const otherModeHref = `${isSignIn ? "/signup" : "/login"}${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ""}`;

  return (
    <div className="max-w-sm mx-auto mt-24 px-6">
      <div className="bg-surface border border-line rounded-xl p-8">
        <h1 className="font-display font-bold text-2xl mb-1">
          {isSignIn ? "Welcome back" : "Join the herd"}
        </h1>
        <p className="text-sm text-ink-faint mb-6">
          {isSignIn
            ? "Sign in to vote, review, and submit APIs."
            : "Free account, takes a few seconds."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={loading}
            className="w-full bg-bg-alt border border-line rounded px-3 py-2.5 text-sm focus:outline-none focus:border-ink-faint transition disabled:opacity-60"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignIn ? "current-password" : "new-password"}
            disabled={loading}
            className="w-full bg-bg-alt border border-line rounded px-3 py-2.5 text-sm focus:outline-none focus:border-ink-faint transition disabled:opacity-60"
            required
          />

          {isSignIn && (
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-ink-faint hover:text-ink-dim transition"
              >
                Forgot password?
              </Link>
            </div>
          )}

          {error && (
            <p role="alert" className="text-flag text-xs">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-tag text-xs">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-tag text-[#1a2015] font-semibold py-2.5 rounded hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? isSignIn
                ? "Signing in..."
                : "Creating account..."
              : isSignIn
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <Link
          href={otherModeHref}
          className="text-xs text-ink-faint hover:text-ink-dim transition w-full text-center mt-5 block"
        >
          {isSignIn ? "Need an account? Sign up" : "Have an account? Sign in"}
        </Link>
      </div>
    </div>
  );
}
