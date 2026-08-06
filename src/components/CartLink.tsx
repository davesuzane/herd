// src/components/CartLink.tsx
"use client";
import Link from "next/link";
import { useCart } from "./CartContext";

export default function CartLink() {
  const { items } = useCart();
  return (
    <Link
      href="/shop/cart"
      className="text-xs font-mono border border-line text-ink-dim px-4 py-2 rounded hover:border-ink-faint transition"
    >
      🛒 Cart {items.length > 0 && `(${items.length})`}
    </Link>
  );
}
