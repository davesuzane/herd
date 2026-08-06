// src/app/shop/sell/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { validateFile } from "@/utils/validateFile";

export default function SellPage() {
  const supabase = createClient();
  const router = useRouter();
  const [onboarded, setOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listingType, setListingType] = useState<"stripe" | "external">(
    "stripe",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/login?redirect=/shop/sell");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_connect_onboarded")
        .eq("id", data.user.id)
        .single();
      setOnboarded(profile?.stripe_connect_onboarded ?? false);
      setLoading(false);
    });
  }, []);

  async function connectPayouts() {
    const res = await fetch("/api/shop/connect", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  async function handleList(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (title.trim().length < 3) {
      setError("Give it a real title.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Add a bit more description.");
      return;
    }

    if (listingType === "external") {
      try {
        const url = new URL(externalUrl);
        if (url.protocol !== "http:" && url.protocol !== "https:")
          throw new Error();
      } catch {
        setError("Enter a valid link, including https://");
        return;
      }
    } else {
      const priceCents = Math.round(parseFloat(price) * 100);
      if (!priceCents || priceCents <= 0) {
        setError("Enter a valid price.");
        return;
      }
      if (!onboarded) {
        setError("Connect your Stripe account first before selling here.");
        return;
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setPosting(true);
    let imageUrl: string | null = null;

    if (file) {
      const validationError = validateFile(file, {
        maxSizeMB: 5,
        allowedTypes: ["image/png", "image/jpeg", "image/webp"],
      });
      if (validationError) {
        setError(validationError);
        setPosting(false);
        return;
      }

      const filePath = `${user.id}/${crypto.randomUUID()}.${file.name
        .split(".")
        .pop()
        ?.replace(/[^a-zA-Z0-9]/g, "")}`;
      const { error: uploadError } = await supabase.storage
        .from("shop-images")
        .upload(filePath, file);
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("shop-images")
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }
    }

    const { error: insertError } = await supabase.from("shop_items").insert({
      seller_id: user.id,
      title,
      description,
      image_url: imageUrl,
      listing_type: listingType,
      price_cents:
        listingType === "stripe" ? Math.round(parseFloat(price) * 100) : 0,
      external_url: listingType === "external" ? externalUrl : null,
    });

    setPosting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    router.push("/shop");
  }

  if (loading)
    return (
      <div className="max-w-md mx-auto mt-24 px-6 text-ink-faint">Loading…</div>
    );

  return (
    <div className="max-w-md mx-auto px-6 mt-16 mb-24">
      <h1 className="font-display font-bold text-2xl mb-6">List an item</h1>

      <form onSubmit={handleList} className="space-y-3">
        <div className="flex gap-4 text-sm mb-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={listingType === "stripe"}
              onChange={() => setListingType("stripe")}
            />{" "}
            Sell here
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={listingType === "external"}
              onChange={() => setListingType("external")}
            />{" "}
            Link elsewhere
          </label>
        </div>

        {listingType === "stripe" && !onboarded && (
          <div className="bg-surface border border-line rounded-lg p-4 mb-2">
            <p className="text-sm text-ink-faint mb-3">
              Connect your Stripe account before selling here — that's how you
              actually get paid.
            </p>
            <button
              type="button"
              onClick={connectPayouts}
              className="w-full text-xs font-mono bg-tag text-[#1a2015] font-semibold py-2 rounded hover:brightness-110 transition"
            >
              Connect with Stripe
            </button>
          </div>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-surface border border-line rounded px-3 py-2.5 text-sm focus:outline-none focus:border-tag transition"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={4}
          className="w-full bg-surface border border-line rounded px-3 py-2.5 text-sm focus:outline-none focus:border-tag transition"
        />

        {listingType === "stripe" ? (
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price (USD)"
            type="number"
            step="0.01"
            className="w-full bg-surface border border-line rounded px-3 py-2.5 text-sm focus:outline-none focus:border-tag transition"
          />
        ) : (
          <input
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="Link to where you're actually selling this"
            className="w-full bg-surface border border-line rounded px-3 py-2.5 text-sm focus:outline-none focus:border-tag transition"
          />
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-ink-dim file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-surface-2 file:text-ink-dim file:text-xs"
        />

        {error && <p className="text-flag text-sm">{error}</p>}

        <button
          type="submit"
          disabled={posting}
          className="w-full bg-tag text-[#1a2015] font-semibold py-2.5 rounded hover:brightness-110 transition disabled:opacity-60"
        >
          {posting ? "Listing…" : "List item"}
        </button>
      </form>
    </div>
  );
}
