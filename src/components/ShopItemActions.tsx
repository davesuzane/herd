// src/components/ShopItemActions.tsx
"use client";
import { useCart } from "./CartContext";

type Item = {
  id: string;
  title: string;
  priceCents: number;
  imageUrl: string | null;
  sellerId: string;
  sellerUsername: string;
  listingType: "stripe" | "external";
  externalUrl: string | null;
};

export default function ShopItemActions({ item }: { item: Item }) {
  const { items, add } = useCart();
  const inCart = items.some((i) => i.id === item.id);

  if (item.listingType === "external") {
    return (
      <a
        href={item.externalUrl ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-mono px-3 py-1.5 rounded-full border border-line text-ink-dim hover:border-ink-faint transition"
      >
        View listing ↗
      </a>
    );
  }

  return (
    <button
      onClick={() =>
        add({
          id: item.id,
          title: item.title,
          priceCents: item.priceCents,
          sellerId: item.sellerId,
          sellerUsername: item.sellerUsername,
          imageUrl: item.imageUrl,
        })
      }
      disabled={inCart}
      className="text-xs font-mono px-3 py-1.5 rounded-full bg-tag text-[#1a2015] font-semibold hover:brightness-110 transition disabled:opacity-50"
    >
      {inCart ? "In cart ✓" : "Add to cart"}
    </button>
  );
}
