// src/components/StoriesGallery.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import StoryUpload from "./StoryUpload";

type Story = { id: string; media_url: string; media_type: "image" | "video" };

export default function StoriesGallery({
  profileId,
  initialStories,
  isSelf,
}: {
  profileId: string;
  initialStories: Story[];
  isSelf: boolean;
}) {
  const supabase = createClient();
  const [stories, setStories] = useState(initialStories);
  const [viewing, setViewing] = useState<Story | null>(null);

  async function reload() {
    const { data } = await supabase
      .from("stories")
      .select("id, media_url, media_type")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });
    setStories(data || []);
  }

  async function deleteStory(id: string) {
    await supabase.from("stories").delete().eq("id", id);
    setStories((prev) => prev.filter((s) => s.id !== id));
    setViewing(null);
  }

  if (stories.length === 0 && !isSelf) return null;

  return (
    <div className="mt-10 pt-6 border-t border-line">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-mono uppercase text-ink-faint">Stories</p>
        {isSelf && <StoryUpload onPosted={reload} />}
      </div>

      {stories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {stories.map((s) => (
            <button
              key={s.id}
              onClick={() => setViewing(s)}
              className="flex-shrink-0 w-16 h-16 rounded-full border-2 border-tag overflow-hidden"
            >
              {s.media_type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.media_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={s.media_url}
                  className="w-full h-full object-cover"
                  muted
                />
              )}
            </button>
          ))}
        </div>
      )}

      {viewing && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
          onClick={() => setViewing(null)}
        >
          <div className="max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            {viewing.media_type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={viewing.media_url}
                alt=""
                className="w-full rounded-lg"
              />
            ) : (
              <video
                src={viewing.media_url}
                className="w-full rounded-lg"
                controls
                autoPlay
              />
            )}
            {isSelf && (
              <button
                onClick={() => deleteStory(viewing.id)}
                className="mt-3 text-xs text-flag hover:brightness-110 transition"
              >
                Delete story
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
