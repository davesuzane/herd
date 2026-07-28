// src/components/ProfileClient.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

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

type Profile = { id: string; username: string; avatar_url: string | null };
type EmojiCount = { emoji: string; votes: number };

export default function ProfileClient({
  profile,
  emojiSummary,
  myVote,
  currentUserId,
}: {
  profile: Profile;
  emojiSummary: EmojiCount[];
  myVote: string | null;
  currentUserId: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(myVote);
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
      {topEmoji && (
        <p className="text-sm text-ink-faint mb-8">
          Recognized as {topEmoji.emoji} by {topEmoji.votes} people
        </p>
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
    </div>
  );
}
