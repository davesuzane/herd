// src/components/ConnectionsClient.tsx
"use client";
import Link from "next/link";
import { useOnlineUsers } from "./PresenceProvider";

type Person = { id: string; username: string; avatarUrl: string | null };

export default function ConnectionsClient({ people }: { people: Person[] }) {
  const onlineIds = useOnlineUsers();

  const sorted = [...people].sort(
    (a, b) => (onlineIds.has(b.id) ? 1 : 0) - (onlineIds.has(a.id) ? 1 : 0),
  );

  return (
    <div className="max-w-md mx-auto px-6 pt-16 pb-24">
      <h1 className="font-display font-bold text-2xl mb-6">Your people</h1>
      <div className="space-y-2">
        {sorted.map((p) => (
          <Link
            key={p.id}
            href={`/u/${p.username}`}
            className="flex items-center gap-3 bg-surface border border-line rounded-lg p-3 hover:border-ink-faint transition"
          >
            <div className="relative">
              {p.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatarUrl}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-xs font-mono text-ink-faint">
                  {p.username[0]?.toUpperCase()}
                </div>
              )}
              {onlineIds.has(p.id) && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-safe rounded-full border-2 border-bg" />
              )}
            </div>
            <span className="text-sm font-mono">@{p.username}</span>
            {onlineIds.has(p.id) && (
              <span className="text-[10px] text-safe ml-auto">online</span>
            )}
          </Link>
        ))}
        {people.length === 0 && (
          <p className="text-sm text-ink-faint">
            You haven't added anyone yet.
          </p>
        )}
      </div>
    </div>
  );
}
