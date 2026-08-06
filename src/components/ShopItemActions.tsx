// src/components/BuyButton.tsx
"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function BuyButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleBuy() {
    const {
      data: { user },
    } = await upabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirect=/shop`);
      return;
    }

    const res = await fetch("/api/shop/checkout", {
      method: "POST",
      body: JSON.stringify({ itemId }),
    });
    const { url, error } = await res.json();
    if (error) {
      alert(error);
      return;
    }
    if (url) window.location.href = url;
  }

  return (
    <button
      onClick={handleBuy}
      className="text-xs font-mono px-3 py-1.5 rounded-full bg-tag text-[#1a2015] font-semibold hover:brightness-110 transition"
    >
      Buy
    </button>
  );
}
