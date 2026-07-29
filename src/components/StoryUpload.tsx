// src/components/StoryUpload.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { validateFile } from "@/utils/validateFile";
import { getVideoDuration } from "@/utils/getVideoDuration";

export default function StoryUpload({ onPosted }: { onPosted: () => void }) {
  const supabase = createClient();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?redirect=/account");
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const validationError = validateFile(file, {
      maxSizeMB: 25,
      allowedTypes: [
        "image/png",
        "image/jpeg",
        "image/webp",
        "video/mp4",
        "video/webm",
      ],
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    if (isVideo) {
      try {
        const duration = await getVideoDuration(file);
        if (duration > 30) {
          setError("Keep videos under 30 seconds.");
          return;
        }
      } catch {
        setError("Could not read that video — try a different file.");
        return;
      }
    }

    setUploading(true);
    const filePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("stories")
      .upload(filePath, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("stories")
      .getPublicUrl(filePath);
    await supabase.from("stories").insert({
      profile_id: user.id,
      media_url: urlData.publicUrl,
      media_type: isVideo ? "video" : "image",
    });

    setUploading(false);
    onPosted();
  }

  return (
    <div>
      <label className="inline-block text-xs font-mono bg-tag text-[#1a2015] font-semibold px-4 py-2 rounded-full hover:brightness-110 transition cursor-pointer">
        {uploading ? "Posting…" : "+ Add a story"}
        <input
          type="file"
          accept="image/*,video/mp4,video/webm"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
      <p className="text-[10px] text-ink-faint mt-1">
        Photos or videos up to 30 seconds. Disappears after 24 hours.
      </p>
      {error && <p className="text-flag text-xs mt-1">{error}</p>}
    </div>
  );
}
