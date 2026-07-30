// src/components/HerdisClient.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { validateFile } from "@/utils/validateFile";
import { getVideoDuration } from "@/utils/getVideoDuration";

type Item = {
  id: string;
  videoUrl: string;
  caption: string | null;
  username: string;
  likeCount: number;
  liked: boolean;
};

export default function HerdisClient({
  items,
  currentUserId,
}: {
  items: Item[];
  currentUserId: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [list, setList] = useState(items);
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function toggleLike(id: string) {
    if (!currentUserId) {
      router.push("/login?redirect=/herdis");
      return;
    }
    const item = list.find((i) => i.id === id);
    if (!item) return;

    if (item.liked) {
      await supabase
        .from("herdis_likes")
        .delete()
        .eq("herdi_id", id)
        .eq("user_id", currentUserId);
    } else {
      await supabase
        .from("herdis_likes")
        .insert({ herdi_id: id, user_id: currentUserId });
    }
    setList((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              liked: !i.liked,
              likeCount: i.likeCount + (i.liked ? -1 : 1),
            }
          : i,
      ),
    );
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;
    setError("");

    const validationError = validateFile(file, {
      maxSizeMB: 25,
      allowedTypes: ["video/mp4", "video/webm"],
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const duration = await getVideoDuration(file);
      if (duration > 30) {
        setError("Keep it under 30 seconds.");
        return;
      }
    } catch {
      setError("Could not read that video.");
      return;
    }

    setUploading(true);
    const filePath = `${currentUserId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("herdis")
      .upload(filePath, file);
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("herdis")
      .getPublicUrl(filePath);
    await supabase
      .from("herdis")
      .insert({
        profile_id: currentUserId,
        video_url: urlData.publicUrl,
        caption: caption || null,
      });

    setUploading(false);
    setShowUpload(false);
    setCaption("");
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="fixed top-[132px] right-4 z-40">
        <button
          onClick={() =>
            currentUserId
              ? setShowUpload(true)
              : router.push("/login?redirect=/herdis")
          }
          className="w-12 h-12 rounded-full bg-tag text-[#1a2015] text-2xl flex items-center justify-center shadow-lg hover:brightness-110 transition"
        >
          +
        </button>
      </div>

      {showUpload && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
          onClick={() => setShowUpload(false)}
        >
          <div
            className="bg-surface border border-line rounded-xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display font-bold text-lg mb-3">
              Post a Herdi
            </h2>
            <input
              type="file"
              accept="video/mp4,video/webm"
              onChange={handleUpload}
              disabled={uploading}
              className="text-sm text-ink-dim file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-surface-2 file:text-ink-dim file:text-xs mb-3"
            />
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="w-full bg-bg-alt border border-line rounded px-3 py-2 text-sm mb-3 focus:outline-none focus:border-tag transition"
            />
            <p className="text-[10px] text-ink-faint mb-2">Up to 30 seconds.</p>
            {uploading && <p className="text-xs text-tag">Uploading…</p>}
            {error && <p className="text-xs text-flag">{error}</p>}
          </div>
        </div>
      )}

      <div className="snap-y snap-mandatory h-[calc(100vh-132px)] overflow-y-scroll">
        {list.map((item) => (
          <div
            key={item.id}
            className="snap-start h-[calc(100vh-132px)] relative flex items-center justify-center bg-black"
          >
            <video
              src={item.videoUrl}
              className="max-h-full max-w-full"
              controls
              loop
              autoPlay
              muted
              playsInline
            />
            <div className="absolute bottom-6 left-4 right-16 text-white">
              <Link
                href={`/u/${item.username}`}
                className="font-mono text-sm font-semibold"
              >
                @{item.username}
              </Link>
              {item.caption && <p className="text-sm mt-1">{item.caption}</p>}
            </div>
            <button
              onClick={() => toggleLike(item.id)}
              className="absolute bottom-6 right-4 flex flex-col items-center gap-1"
            >
              <span className={`text-3xl ${item.liked ? "" : "opacity-60"}`}>
                {item.liked ? "❤️" : "🤍"}
              </span>
              <span className="text-white text-xs font-mono">
                {item.likeCount}
              </span>
            </button>
          </div>
        ))}
        {list.length === 0 && (
          <div className="h-full flex items-center justify-center text-ink-faint text-sm">
            No Herdis yet — post the first one.
          </div>
        )}
      </div>
    </div>
  );
}
