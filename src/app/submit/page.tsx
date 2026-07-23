// src/app/submit/page.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { compressImage } from "@/utils/compressImage";

export default function SubmitPage() {
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [pricingType, setPricingType] = useState<"free" | "paid">("free");
  const [pricingNote, setPricingNote] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    function isValidUrl(value: string) {
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?redirect=/submit");
      return;
    }
    if (!isValidUrl(baseUrl)) {
      setError("Enter a valid URL, including https://");
      setLoading(false);
      return;
    }
    if (description.trim().length < 20) {
      setError(
        "Description needs to be at least 20 characters — say what it actually does.",
      );
      setLoading(false);
      return;
    }
    const scanRes = await fetch("/api/scan", {
      method: "POST",
      body: JSON.stringify({ url: baseUrl }),
    });
    const { result: scanResult } = await scanRes.json();

    const { data: api, error: apiError } = await supabase
      .from("apis")
      .insert({
        name,
        base_url: baseUrl,
        description,
        submitted_by: user.id,
        scan_result: scanResult,
        pricing_type: pricingType,
        pricing_note: pricingType === "paid" ? pricingNote : null,
      })
      .select()
      .single();

    if (apiError) {
      setError(apiError.message);
      setLoading(false);
      return;
    }

    const tagNames = tags
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);
    for (const tagName of tagNames) {
      const { data: existing } = await supabase
        .from("tags")
        .select("id")
        .eq("name", tagName)
        .single();
      let tagId = existing?.id;
      if (!tagId) {
        const { data: newTag } = await supabase
          .from("tags")
          .insert({ name: tagName, created_by: user.id })
          .select()
          .single();
        tagId = newTag?.id;
      }
      if (tagId)
        await supabase
          .from("api_tags")
          .insert({ api_id: api.id, tag_id: tagId });
    }

    if (images) {
      for (const file of Array.from(images)) {
        const compressed = await compressImage(file);
        const filePath = `${api.id}/${crypto.randomUUID()}-${compressed.name}`;
        const { error: uploadError } = await supabase.storage
          .from("api-images")
          .upload(filePath, compressed);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("api-images")
            .getPublicUrl(filePath);
          await supabase.from("api_images").insert({
            api_id: api.id,
            image_url: urlData.publicUrl,
            uploaded_by: user.id,
          });
        }
      }
    }

    setLoading(false);
    router.push(`/api/${api.id}`);
  }

  return (
    <div className="max-w-lg mx-auto mt-16 px-6 mb-24">
      <h1 className="font-display font-bold text-2xl mb-1">Add an API</h1>
      <p className="text-sm text-ink-faint mb-6">
        Free to list. Always will be.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Base URL">
          <input
            placeholder="https://"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Description">
          <textarea
            placeholder="What does it do?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
            rows={3}
            required
            minLength={20}
          />
        </Field>
        <Field label="Tags">
          <input
            placeholder="weather, free-tier, geo"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={inputClass}
          />
        </Field>

        <div>
          <label className="text-xs font-mono uppercase text-ink-faint block mb-2">
            Pricing
          </label>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={pricingType === "free"}
                onChange={() => setPricingType("free")}
              />{" "}
              Free
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={pricingType === "paid"}
                onChange={() => setPricingType("paid")}
              />{" "}
              Paid
            </label>
          </div>
        </div>
        {pricingType === "paid" && (
          <input
            placeholder="$0.01/request or $9/mo"
            value={pricingNote}
            onChange={(e) => setPricingNote(e.target.value)}
            className={inputClass}
          />
        )}

        <div>
          <label className="text-xs font-mono uppercase text-ink-faint block mb-2">
            Screenshots / logo
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImages(e.target.files)}
            className="text-sm text-ink-dim file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-surface-2 file:text-ink-dim file:text-xs"
          />
        </div>

        {error && <p className="text-flag text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-tag text-[#1a2015] font-semibold py-3 rounded hover:brightness-110 transition disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit — free"}
        </button>
      </form>
    </div>
  );
}

const inputClass =
  "w-full bg-surface border border-line rounded px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-faint transition";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-mono uppercase text-ink-faint block mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}
