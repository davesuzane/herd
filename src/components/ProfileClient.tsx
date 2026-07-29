// src/components/ProfileClient.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ProfileShare from "./ProfileShare";
import Link from "next/link";

const EMOJI_PALETTE = [
  "👑",
  "🔥",
  "⭐",
  "🐐",
  "❤️",
  "🤡",
  "💩",
  "😈",
  "🚩",
  "🧊",
  "🎯",
  "🤝",
];

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
};
type EmojiCount = { emoji: string; votes: number };
type ApiSummary = {
  id: string;
  name: string;
  pricing_type: string;
  scan_result: string;
};
type MethodSummary = { id: string; title: string };
type LinkSummary = { id: string; url: string; title: string | null };

type Photo = { id: string; image_url: string };
type Story = {
  id: string;
  media_url: string;
  media_type: string;
};

export default function ProfileClient({
  profile,
  emojiSummary,
  myVote,
  currentUserId,
  apis,
  methods,
  links,
  isAdded,
  addedByCount,
  followingCount,
  followerCount,
  friendCount,
  photos,
stories,
}: {
  profile: Profile;
  emojiSummary: EmojiCount[];
  myVote: string | null;
  currentUserId: string | null;
  apis: ApiSummary[];
  methods: MethodSummary[];
  links: LinkSummary[];
  isAdded: boolean;
  addedByCount: number;
  followingCount: number;
  followerCount: number;
  friendCount: number;
  photos: Photo[];
stories: Story[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(myVote);
  const [added, setAdded] = useState(isAdded);
  const [addedCount, setAddedCount] = useState(addedByCount);
  const [galleryPhotos, setGalleryPhotos] = useState(photos);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;
    setUploadingPhoto(true);

    const filePath = `${currentUserId}/gallery-${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      const { data: created } = await supabase
        .from("profile_photos")
        .insert({ profile_id: currentUserId, image_url: urlData.publicUrl })
        .select()
        .single();
      if (created) setGalleryPhotos((prev) => [created, ...prev]);
    }
    setUploadingPhoto(false);
  }

  async function deletePhoto(photoId: string) {
    await supabase.from("profile_photos").delete().eq("id", photoId);
    setGalleryPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }
  async function toggleAdd() {
    if (!currentUserId) {
      router.push(`/login?redirect=/u/${profile.username}`);
      return;
    }
    if (isSelf) return;

    if (added) {
      await supabase
        .from("connections")
        .delete()
        .eq("owner_id", currentUserId)
        .eq("added_id", profile.id);
      setAdded(false);
      setAddedCount((c) => Math.max(0, c - 1));
    } else {
      const { error } = await supabase
        .from("connections")
        .insert({ owner_id: currentUserId, added_id: profile.id });
      if (!error) {
        setAdded(true);
        setAddedCount((c) => c + 1);
      }
    }
  }
  const [customEmoji, setCustomEmoji] = useState("");

  const isSelf = currentUserId === profile.id;
  const topEmoji = [...emojiSummary].sort((a, b) => b.votes - a.votes)[0];

  async function castVote(emoji: string) {
    if (!currentUserId) {
      router.push(`/login?redirect=/u/${profile.username}`);
      return;
    }
    if (isSelf) return;

    const { error } = await supabase
      .from("profile_emoji_votes")
      .upsert(
        { profile_id: profile.id, voter_id: currentUserId, emoji },
        { onConflict: "profile_id,voter_id" },
      );

    if (!error) {
      setSelected(emoji);
      router.refresh();
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 pt-20 pb-24 text-center">
      <div className="relative inline-block mb-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.username}
            className="w-24 h-24 rounded-full object-cover border border-line"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-surface border border-line flex items-center justify-center text-2xl font-mono text-ink-faint">
            {profile.username[0]?.toUpperCase()}
          </div>
        )}
        {topEmoji && (
          <span className="absolute -bottom-1 -right-1 text-3xl bg-bg rounded-full">
            {topEmoji.emoji}
          </span>
        )}
      </div>

      <h1 className="font-display font-bold text-2xl mb-1">
        @{profile.username}
      </h1>
      {profile.bio && (
        <p className="text-sm text-ink-dim mb-4">{profile.bio}</p>
      )}
      <div className="flex justify-center gap-6 text-xs font-mono text-ink-faint mb-4">
        <span>
          <span className="text-ink">{followingCount}</span> following
        </span>
        <span>
          <span className="text-ink">{followerCount}</span> followers
        </span>
        <span>
          <span className="text-ink">{friendCount}</span> friends
        </span>
      </div>
      {topEmoji && (
        <p className="text-sm text-ink-faint mb-8">
          Recognized as {topEmoji.emoji} by {topEmoji.votes} people
        </p>
      )}
      <p className="text-xs text-ink-faint mb-6">
        Added by {addedCount} people
      </p>

      {!isSelf && (
        <div className="flex gap-2 justify-center mb-8">
          <button
            onClick={toggleAdd}
            className={`text-xs font-mono px-4 py-2 rounded-full border transition ${
              added
                ? "border-tag text-tag bg-tag/10"
                : "border-line text-ink-dim hover:border-ink-faint"
            }`}
          >
            {added ? "Added ✓" : "Add this people"}
          </button>
          <a
            href={`/chat?dm=${profile.username}`}
            className="text-xs font-mono px-4 py-2 rounded-full border border-line text-ink-dim hover:border-ink-faint transition"
          >
            Message
          </a>
        </div>
      )}
      {!topEmoji && <p className="text-sm text-ink-faint mb-8">No votes yet</p>}

      {!isSelf && (
        <>
          <p className="text-xs font-mono uppercase text-ink-faint mb-3">
            Give them an emoji
          </p>
          <div className="grid grid-cols-6 gap-2 mb-4">
            {EMOJI_PALETTE.map((emoji) => (
              <button
                key={emoji}
                onClick={() => castVote(emoji)}
                className={`text-2xl p-2 rounded-lg border transition ${
                  selected === emoji
                    ? "border-tag bg-tag/10"
                    : "border-line hover:border-ink-faint"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customEmoji.trim()) castVote(customEmoji.trim());
            }}
            className="flex gap-2 max-w-[200px] mx-auto"
          >
            <input
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value)}
              placeholder="or type one"
              maxLength={4}
              className="flex-1 bg-bg-alt border border-line rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:border-ink-faint transition"
            />
            <button
              type="submit"
              className="text-xs font-mono bg-tag text-[#1a2015] font-semibold px-3 rounded hover:brightness-110 transition"
            >
              Give
            </button>
          </form>
        </>
      )}

      {isSelf && (
        <p className="text-xs text-ink-faint">You can't vote on yourself.</p>
      )}

      {emojiSummary.length > 0 && (
        <div className="mt-10 pt-6 border-t border-line">
          <p className="text-xs font-mono uppercase text-ink-faint mb-3">
            All votes
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {emojiSummary.map((e) => (
              <span
                key={e.emoji}
                className="text-sm bg-surface border border-line rounded-full px-3 py-1"
              >
                {e.emoji} {e.votes}
              </span>
            ))}
          </div>
        </div>
      )}

      {(apis.length > 0 || methods.length > 0 || links.length > 0) && (
        <div className="mt-10 pt-6 border-t border-line text-left space-y-6">
          {apis.length > 0 && (
            <div>
              <p className="text-xs font-mono uppercase text-ink-faint mb-2">
                APIs submitted
              </p>
              <div className="space-y-1">
                {apis.map((api) => (
                  <Link
                    key={api.id}
                    href={`/api/${api.id}`}
                    className="flex items-center justify-between text-sm hover:text-tag transition"
                  >
                    <span className="font-mono">{api.name}</span>
                    <span className="text-[10px] font-mono text-ink-faint uppercase">
                      {api.pricing_type}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-line">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono uppercase text-ink-faint">
                Photos
              </p>
              {isSelf && (
                <label className="text-[10px] font-mono text-tag hover:brightness-110 transition cursor-pointer">
                  {uploadingPhoto ? "Uploading…" : "+ Add photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {galleryPhotos.map((p) => (
                <div key={p.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image_url}
                    alt=""
                    className="w-full aspect-square object-cover rounded-lg border border-line"
                  />
                  {isSelf && (
                    <button
                      onClick={() => deletePhoto(p.id)}
                      className="absolute top-1 right-1 text-[10px] bg-bg/80 text-flag px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {galleryPhotos.length === 0 && (
              <p className="text-sm text-ink-faint">No photos yet.</p>
            )}
          </div>
          {methods.length > 0 && (
            <div>
              <p className="text-xs font-mono uppercase text-ink-faint mb-2">
                Methods shared
              </p>
              <div className="space-y-1">
                {methods.map((m) => (
                  <Link
                    key={m.id}
                    href={`/methods/${m.id}`}
                    className="block text-sm hover:text-methods transition"
                  >
                    {m.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {links.length > 0 && (
            <div>
              <p className="text-xs font-mono uppercase text-ink-faint mb-2">
                Links dropped
              </p>
              <div className="space-y-1">
                {links.map((l) => (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-ink-dim hover:text-sites transition truncate"
                  >
                    {l.title || l.url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {apis.length === 0 && methods.length === 0 && links.length === 0 && (
        <p className="mt-10 pt-6 border-t border-line text-sm text-ink-faint">
          Hasn't posted anything yet.
        </p>
      )}
      <div className="mt-10">
        <ProfileShare username={profile.username} />
      </div>
    </div>
  );
}
