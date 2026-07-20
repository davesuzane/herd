// src/app/submit/page.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function SubmitPage() {
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sign in first.");
      return;
    }

    // 1. Trigger a URL scan (server route, see step 10)
    const scanRes = await fetch("/api/scan", {
      method: "POST",
      body: JSON.stringify({ url: baseUrl }),
    });
    const { result: scanResult } = await scanRes.json();

    // 2. Insert the API
    const { data: api, error: apiError } = await supabase
      .from("apis")
      .insert({
        name,
        base_url: baseUrl,
        description,
        submitted_by: user.id,
        scan_result: scanResult,
      })
      .select()
      .single();

    if (apiError) {
      setError(apiError.message);
      return;
    }

    // 3. Create/attach tags
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

    router.push(`/api/${api.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto mt-16 space-y-4">
      <h1 className="text-xl font-semibold">Add an API</h1>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />
      <input
        placeholder="Base URL (https://...)"
        value={baseUrl}
        onChange={(e) => setBaseUrl(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />
      <textarea
        placeholder="What does it do?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border p-2 rounded"
        rows={3}
      />
      <input
        placeholder="Tags, comma separated (weather, free-tier)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="w-full border p-2 rounded"
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" className="w-full bg-black text-white p-2 rounded">
        Submit — free
      </button>
    </form>
  );
}
