// src/components/StoriesTray.tsx
"use client";
import { useState } from "react";
import Link from "next/link";

type StoryItem = {
  id: string;
  media_url: string;
  media_type: "image" | "video";
};
type Person = {
  profileId: string;
  username: string;
  avatarUrl: string | null;
  stories: StoryItem[];
};

export default function StoriesTray({ people }: { people: Person[] }) {
  const [viewing, setViewing] = useState<Person | null>(null);
  const [index, setIndex] = useState(0);

  function openPerson(p: Person) {
    setViewing(p);
    setIndex(0);
  }

  function next() {
    if (!viewing) return;
    if (index < viewing.stories.length - 1) setIndex((i) => i + 1);
    else setViewing(null);
  }

  return (
    <>
      <div className="border-b border-line bg-bg-alt">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4 overflow-x-auto">
          <Link
            href="/chat"
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className="w-14 h-14 rounded-full bg-tag flex items-center justify-center text-xl">
              💬
            </div>
            <span className="text-[10px] font-mono text-ink-faint">Chat</span>
          </Link>

          {people.map((p) => (
            <button
              key={p.profileId}
              onClick={() => openPerson(p)}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-tag via-flag to-methods">
                <div className="w-full h-full rounded-full bg-bg-alt p-0.5">
                  {p.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.avatarUrl}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-xs font-mono text-ink-faint">
                      {p.username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-mono text-ink-faint truncate w-14 text-center">
                {p.username}
              </span>
            </button>
          ))}

          {people.length === 0 && (
            <span className="text-xs text-ink-faint">
              No stories yet — add yours from your profile.
            </span>
          )}
        </div>
      </div>

      {viewing && (
        <div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={next}
        >
          <div className="absolute top-4 left-4 right-4 flex gap-1">
            {viewing.stories.map((_, i) => (
              <div
                key={i}
                className={`h-0.5 flex-1 rounded ${i <= index ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>
          <div
            className="max-w-sm w-full px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {viewing.stories[index].media_type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={viewing.stories[index].media_url}
                alt=""
                className="w-full rounded-lg"
              />
            ) : (
              <video
                src={viewing.stories[index].media_url}
                className="w-full rounded-lg"
                autoPlay
                onEnded={next}
              />
            )}
          </div>
          <button
            onClick={() => setViewing(null)}
            className="absolute top-4 right-4 text-white text-2xl"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
