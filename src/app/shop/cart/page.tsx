// src/app/shop/cart/page.tsx
"use client";
import { useState } from "react";
import { useCart } from "@/components/CartContext";

export default function CartPage() {
  const { items, remove, clear } = useCart();
  const [loadingSeller, setLoadingSeller] = useState<string | null>(null);
  const [error, setError] = useState("");

  const bySeller = items.reduce<Record<string, typeof items>>((acc, item) => {
    acc[item.sellerId] = acc[item.sellerId]
      ? [...acc[item.sellerId], item]
      : [item];
    return acc;
  }, {});

  async function checkoutSeller(sellerId: string) {
    setError("");
    setLoadingSeller(sellerId);
    const itemIds = bySeller[sellerId].map((i) => i.id);

    const res = await fetch("/api/shop/checkout", {
      method: "POST",
      body: JSON.stringify({ itemIds }),
    });
    const { url, error } = await res.json();

    setLoadingSeller(null);
    if (error) {
      setError(error);
      return;
    }
    if (url) window.location.href = url;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-24 px-6 text-center text-ink-faint">
        Your cart is empty.
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 pt-16 pb-24">
      <h1 className="font-display font-bold text-2xl mb-6">Cart</h1>

      {Object.entries(bySeller).map(([sellerId, sellerItems]) => {
        const subtotal = sellerItems.reduce((sum, i) => sum + i.priceCents, 0);
        return (
          <div
            key={sellerId}
            className="bg-surface border border-line rounded-lg p-4 mb-4"
          >
            <p className="text-xs font-mono text-ink-faint mb-3">
              from @{sellerItems[0].sellerUsername}
            </p>
            {sellerItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm mb-2"
              >
                <span>{item.title}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono">
                    ${(item.priceCents / 100).toFixed(2)}
                  </span>
                  <button
                    onClick={() => remove(item.id)}
                    className="text-flag text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 mt-3 border-t border-line">
              <span className="text-sm font-semibold">
                Subtotal: ${(subtotal / 100).toFixed(2)}
              </span>
              <button
                onClick={() => checkoutSeller(sellerId)}
                disabled={loadingSeller === sellerId}
                className="text-xs font-mono bg-tag text-[#1a2015] font-semibold px-4 py-2 rounded hover:brightness-110 transition disabled:opacity-60"
              >
                {loadingSeller === sellerId
                  ? "Redirecting…"
                  : `Checkout with @${sellerItems[0].sellerUsername}`}
              </button>
            </div>
          </div>
        );
      })}

      {error && <p className="text-flag text-sm mb-4">{error}</p>}

      {Object.keys(bySeller).length > 1 && (
        <p className="text-xs text-ink-faint">
          Items from different sellers checkout separately — each is its own
          payment, split with that seller directly.
        </p>
      )}

      <button onClick={clear} className="text-xs text-ink-faint underline mt-6">
        Clear cart
      </button>
    </div>
  );
}
