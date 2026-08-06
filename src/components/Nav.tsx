// src/components/Nav.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import AuthGateButton from "./AuthGateButton";
import CartLink from "./CartLink";

type Profile = { username: string; is_pro: boolean; avatar_url: string | null };

export default function Nav() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("username, is_pro, avatar_url")
          .eq("id", user.id)
          .single();

        setProfile({
          username: data?.username ?? user.email ?? "you",
          is_pro: data?.is_pro ?? false,
          avatar_url: data?.avatar_url ?? null,
        });
      } else {
        setProfile(null);
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
          <svg viewBox="0 0 20 14" className="w-5 h-3.5" fill="none">
            <path
              d="M1 5.5C1 3 3 1 6 1H15C17.2 1 19 2.8 19 5V7L11 13L1 8V5.5Z"
              stroke="#E3B23C"
              strokeWidth="1.4"
            />
            <circle cx="5" cy="5" r="1.3" fill="#E3B23C" />
          </svg>
          Herd
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/apis#browse"
            className="text-sm text-ink-dim hover:text-ink transition-colors hidden sm:block"
          >
            Browse
          </Link>

          <CartLink />

          {profile ? (
            <div className="flex items-center gap-4">
              <Link
                href={`/u/${profile.username}`}
                className="flex items-center gap-2 text-sm font-mono text-ink-dim hidden sm:flex hover:text-ink transition-colors"
              >
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : null}
                {profile.username}
                {profile.is_pro && (
                  <span className="text-tag text-xs">★ Pro</span>
                )}
              </Link>
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
              <AuthGateButton
                href="/submit"
                className="bg-tag text-[#1a2015] font-semibold text-sm px-4 py-2 rounded hover:brightness-110 transition"
              >
                Add an API
              </AuthGateButton>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
