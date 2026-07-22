// src/app/login/page.tsx
"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

type AuthMode = "signin" | "signup";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("signin");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignIn = mode === "signin";

  function getSafeRedirect() {
    const redirect = searchParams.get("redirect");

    // Only allow internal paths.
    // Prevents redirects like https://malicious-site.com
    if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
      return redirect;
    }

    return "/";
  }

  function getAuthErrorMessage(errorMessage: string) {
    const message = errorMessage.toLowerCase();

    if (message.includes("invalid login credentials")) {
      return "Incorrect email or password.";
    }

    if (message.includes("email not confirmed")) {
      return "Please confirm your email before signing in.";
    }

    if (message.includes("user already registered")) {
      return "An account with this email already exists.";
    }

    if (message.includes("password should be at least")) {
      return "Your password is too short.";
    }

    if (message.includes("rate limit")) {
      return "Too many requests. Please wait a little before trying again.";
    }

    return errorMessage;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email.");
      return;
    }

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
          });

      if (result.error) {
        setError(getAuthErrorMessage(result.error.message));
        return;
      }

      // Signup with email confirmation enabled may not immediately
      // create an active session.
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

  function toggleMode() {
    if (loading) return;

    setMode((currentMode) => (currentMode === "signin" ? "signup" : "signin"));

    setError("");
    setMessage("");
  }

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

        <button
          type="button"
          onClick={toggleMode}
          disabled={loading}
          className="text-xs text-ink-faint hover:text-ink-dim transition w-full text-center mt-5 disabled:opacity-60"
        >
          {isSignIn ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
