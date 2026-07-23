"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import AuthGateButton from "./AuthGateButton";

export default function Nav() {
  const supabase = createClient();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        setUsername(profile?.username ?? user.email ?? "you");
      } else {
        setUsername(null);
      }
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());

    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 bg-bg/90 backdrop-blur border-b border-line">
      <div className="max-w-5xl mx-auto px-6 h-[68px] flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-display font-bold text-xl"
        >
          <Image
            src="/apiherd-logo.png"
            alt="Apiherd"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
            priority
          />
          apiherd
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/#browse"
            className="text-sm text-ink-dim hover:text-ink transition-colors hidden sm:block"
          >
            Browse
          </Link>

          {username ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono text-ink-dim hidden sm:block">
                {username}
              </span>

              <button
                onClick={signOut}
                className="text-sm text-ink-faint hover:text-ink transition-colors"
              >
                Sign out
              </button>

              <Link
                href="/submit"
                className="bg-tag text-[#1a2015] font-semibold text-sm px-4 py-2 rounded hover:brightness-110 transition"
              >
                Add an API
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-ink-dim hover:text-ink transition-colors"
              >
                Sign in
              </Link>

              <Link
                href="/signup"
                className="text-sm text-ink-dim hover:text-ink transition-colors"
              >
                Sign up
              </Link>

              <AuthGateButton
                href="/submit"
                className="bg-tag text-[#1a2015] font-semibold text-sm px-4 py-2 rounded hover:brightness-110 transition"
              >
                Add an API
              </AuthGateButton>

              <Link
                href="/pro"
                className="text-sm text-ink-dim hover:text-ink transition-colors"
              >
                Become pro
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
