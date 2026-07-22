// src/components/BoostButton.tsx
"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function BoostButton({ apiId }: { apiId: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleBoost() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirect=/api/${apiId}`);
      return;
    }

    const res = await fetch("/api/boost", {
      method: "POST",
      body: JSON.stringify({ apiId }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  return (
    <button
      onClick={handleBoost}
      className="text-xs font-mono px-3 py-1.5 rounded-full border border-tag/40 text-tag hover:bg-tag/10 transition"
    >
      Boost — $5 / 7 days
    </button>
  );
}
