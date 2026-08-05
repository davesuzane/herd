// src/app/shop/page.tsx
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import BuyButton from "@/components/BuyButton";

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("shop_items")
    .select("id, title, description, price_cents, image_url, seller_id")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto px-6 pt-16 pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display font-bold text-3xl">Shop</h1>
        <Link
          href="/shop/sell"
          className="text-xs font-mono bg-tag text-[#1a2015] font-semibold px-4 py-2 rounded hover:brightness-110 transition"
        >
          + Sell something
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {(items || []).map((item) => (
          <div
            key={item.id}
            className="bg-surface border border-line rounded-lg overflow-hidden"
          >
            {item.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url}
                alt=""
                className="w-full aspect-square object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="font-mono text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-ink-dim mb-3 line-clamp-2">
                {item.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-tag">
                  ${(item.price_cents / 100).toFixed(2)}
                </span>
                <BuyButton itemId={item.id} />
              </div>
            </div>
          </div>
        ))}
        {(!items || items.length === 0) && (
          <p className="text-sm text-ink-faint">Nothing for sale yet.</p>
        )}
      </div>
    </div>
  );
}
