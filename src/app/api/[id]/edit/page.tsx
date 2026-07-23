// src/app/api/[id]/edit/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function EditApiPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [loaded, setLoaded] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [description, setDescription] = useState("");
  const [pricingType, setPricingType] = useState<"free" | "paid">("free");
  const [pricingNote, setPricingNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: api } = await supabase
        .from("apis")
        .select("*")
        .eq("id", id)
        .single();

      if (!user || !api || api.submitted_by !== user.id) {
        router.replace(`/api/${id}`);
        return;
      }

      setName(api.name);
      setBaseUrl(api.base_url);
      setDescription(api.description ?? "");
      setPricingType(api.pricing_type);
      setPricingNote(api.pricing_note ?? "");
      setAllowed(true);
      setLoaded(true);
    }
    load();
  }, [id]);

  function isValidUrl(value: string) {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isValidUrl(baseUrl)) {
      setError("Enter a valid URL, including https://");
      return;
    }
    if (description.trim().length < 20) {
      setError("Description needs to be at least 20 characters.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("apis")
      .update({
        name,
        base_url: baseUrl,
        description,
        pricing_type: pricingType,
        pricing_note: pricingType === "paid" ? pricingNote : null,
      })
      .eq("id", id);
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/api/${id}`);
  }

  if (!loaded)
    return (
      <div className="max-w-lg mx-auto mt-16 px-6 text-ink-faint">Loading…</div>
    );
  if (!allowed) return null;

  return (
    <div className="max-w-lg mx-auto mt-16 px-6 mb-24">
      <h1 className="font-display font-bold text-2xl mb-6">Edit listing</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-surface border border-line rounded px-3 py-2.5 text-sm"
          required
        />
        <input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className="w-full bg-surface border border-line rounded px-3 py-2.5 text-sm"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-surface border border-line rounded px-3 py-2.5 text-sm"
          rows={3}
          required
          minLength={20}
        />

        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={pricingType === "free"}
              onChange={() => setPricingType("free")}
            />{" "}
            Free
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={pricingType === "paid"}
              onChange={() => setPricingType("paid")}
            />{" "}
            Paid
          </label>
        </div>
        {pricingType === "paid" && (
          <input
            value={pricingNote}
            onChange={(e) => setPricingNote(e.target.value)}
            placeholder="$0.01/request or $9/mo"
            className="w-full bg-surface border border-line rounded px-3 py-2.5 text-sm"
          />
        )}

        {error && <p className="text-flag text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-tag text-[#1a2015] font-semibold py-2.5 rounded hover:brightness-110 transition disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
