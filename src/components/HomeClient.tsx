// src/components/HomeClient.tsx
"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import VoteButtons from "@/components/VoteButtons";
import CopyLinkButton from "@/components/CopyLinkButton";
import DeleteApiButton from "@/components/DeleteApiButton";

type Api = {
  id: string;
  name: string;
  base_url: string;
  description: string | null;
  scan_result: string;
  pricing_type: "free" | "paid";
  pricing_note: string | null;
  boosted_until?: string | null;
  submitted_by: string;
  tags?: string[];
};

type TagCount = { id: string; name: string; api_count: number };

export default function HomeClient({
  apis,
  topTags,
  totalVotes,
}: {
  apis: Api[];
  topTags: TagCount[];
  totalVotes: number;
}) {
  const [query, setQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return apis;
    const q = query.toLowerCase().replace(/^#/, "");
    return apis.filter(
      (api) =>
        api.name.toLowerCase().includes(q) ||
        api.description?.toLowerCase().includes(q) ||
        api.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }, [query, apis]);

  const isBoosted = (a: Api) =>
    a.boosted_until && new Date(a.boosted_until) > new Date();
  const paid = filtered
    .filter((a) => a.pricing_type === "paid")
    .sort((a, b) => (isBoosted(b) ? 1 : 0) - (isBoosted(a) ? 1 : 0));
  const free = filtered
    .filter((a) => a.pricing_type === "free")
    .sort((a, b) => (isBoosted(b) ? 1 : 0) - (isBoosted(a) ? 1 : 0));

  return (
    <div className="grid md:grid-cols-[1fr_260px] gap-10">
      <div className="space-y-14">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search APIs or #tags..."
          className="w-full bg-surface border border-line rounded-lg px-4 py-3 text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-faint transition"
        />

        {paid.length > 0 && (
          <section>
            <h2 className="font-display font-semibold text-xl mb-4">
              Paid APIs
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {paid.map((api) => (
                <ApiCard
                  key={api.id}
                  api={api}
                  boosted={!!isBoosted(api)}
                  isOwner={userId === api.submitted_by}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-display font-semibold text-xl mb-4">Free APIs</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {free.map((api) => (
              <ApiCard
                key={api.id}
                api={api}
                boosted={!!isBoosted(api)}
                isOwner={userId === api.submitted_by}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-sm text-ink-faint">Nothing matches "{query}".</p>
          )}
        </section>
      </div>

      <aside className="space-y-8">
        <div className="bg-surface border border-line rounded-lg p-4">
          <h3 className="font-mono text-xs uppercase text-ink-faint mb-3">
            The herd, right now
          </h3>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-ink-dim">Listings</span>
            <span className="font-mono">{apis.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-dim">Votes cast</span>
            <span className="font-mono">{totalVotes}</span>
          </div>
        </div>

        {topTags.length > 0 && (
          <div className="bg-surface border border-line rounded-lg p-4">
            <h3 className="font-mono text-xs uppercase text-ink-faint mb-3">
              Popular tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {topTags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setQuery(t.name)}
                  className="text-xs font-mono border border-line rounded-full px-2.5 py-1 text-ink-dim hover:border-tag hover:text-tag transition"
                >
                  #{t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-surface border border-line rounded-lg p-4 space-y-2">
          <h3 className="font-mono text-xs uppercase text-ink-faint mb-1">
            Quick links
          </h3>
          <Link
            href="/submit"
            className="block text-sm text-ink-dim hover:text-tag transition"
          >
            Add an API
          </Link>
          <Link
            href="/pro"
            className="block text-sm text-ink-dim hover:text-tag transition"
          >
            Become Pro
          </Link>
          <Link
            href="/mysink"
            className="block text-sm text-ink-dim hover:text-tag transition"
          >
            Leaked api
          </Link>
        </div>
      </aside>
    </div>
  );
}

function statusStyle(scanResult: string) {
  if (scanResult === "malicious" || scanResult === "suspicious")
    return "bg-flag-dim text-flag";
  if (scanResult === "clean") return "bg-safe-dim text-safe";
  return "bg-surface-2 text-ink-faint";
}

function ApiCard({
  api,
  boosted,
  isOwner,
}: {
  api: Api;
  boosted: boolean;
  isOwner: boolean;
}) {
  return (
    <div
      className={`bg-surface border rounded-lg p-5 transition hover:border-ink-faint ${boosted ? "border-tag" : "border-line"}`}
    >
      <div className="flex justify-between items-start mb-2">
        <Link
          href={`/api/${api.id}`}
          className="font-mono text-sm hover:text-tag transition"
        >
          {api.name}
        </Link>
        <div className="flex gap-2">
          {boosted && (
            <span className="text-[10px] font-mono uppercase bg-tag text-[#1a2015] px-2 py-0.5 rounded-full">
              Boosted
            </span>
          )}
          {api.pricing_type === "paid" && (
            <span className="text-[10px] font-mono uppercase bg-tag/15 text-tag px-2 py-0.5 rounded-full">
              {api.pricing_note || "Paid"}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-mono text-ink-faint">{api.base_url}</span>
        <CopyLinkButton url={api.base_url} />
      </div>

      <p className="text-sm text-ink-dim mb-4 leading-relaxed">
        {api.description}
      </p>

      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${statusStyle(api.scan_result)}`}
        >
          {api.scan_result}
        </span>
        {isOwner ? (
          <div className="flex gap-2">
            <Link
              href={`/api/${api.id}/edit`}
              className="text-xs font-mono text-ink-faint hover:text-ink-dim transition"
            >
              Edit
            </Link>
            <DeleteApiButton apiId={api.id} />
          </div>
        ) : (
          <VoteButtons apiId={api.id} />
        )}
      </div>
    </div>
  );
}
