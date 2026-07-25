// src/components/UtilSitesClient.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Category = { id: string; name: string };
type LinkRow = {
  id: string;
  url: string;
  title: string | null;
  category_id: string;
  submitted_by: string;
  created_at: string;
};
type PendingRequest = { name: string; request_count: number };

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function UtilSitesClient({
  categories,
  links,
  pendingRequests,
}: {
  categories: Category[];
  links: LinkRow[];
  pendingRequests: PendingRequest[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(
    categories[0]?.id ?? "",
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState("");

  const [requestText, setRequestText] = useState("");
  const [requestStatus, setRequestStatus] = useState("");

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!userId) {
      router.push("/login?redirect=/util-sites");
      return;
    }
    if (!isValidUrl(newUrl)) {
      setError("Enter a valid URL, including https://");
      return;
    }
    if (!activeCategory) {
      setError("Pick a category first.");
      return;
    }

    const { error } = await supabase.from("useful_links").insert({
      category_id: activeCategory,
      url: newUrl,
      title: newTitle || null,
      submitted_by: userId,
    });
    if (error) {
      setError(error.message);
      return;
    }

    setNewUrl("");
    setNewTitle("");
    setShowAddForm(false);
    router.refresh();
  }

  async function handleRequestCategory(e: React.FormEvent) {
    e.preventDefault();
    setRequestStatus("");
    if (!userId) {
      router.push("/login?redirect=/util-sites");
      return;
    }

    const normalized = requestText.trim().toLowerCase();
    if (!normalized) return;

    const { error } = await supabase
      .from("category_requests")
      .insert({ name: normalized, requested_by: userId });
    if (error) {
      setRequestStatus(
        error.message.includes("duplicate")
          ? "You've already requested this one."
          : error.message,
      );
      return;
    }
    setRequestText("");
    setRequestStatus("Vote counted — thanks.");
    router.refresh();
  }

  async function reportLink(linkId: string) {
    if (!userId) {
      router.push("/login?redirect=/util-sites");
      return;
    }
    const reason =
      prompt("Why are you reporting this link? (optional)") || null;
    await supabase
      .from("link_reports")
      .insert({ link_id: linkId, reported_by: userId, reason });
    alert("Reported — thanks, we'll take a look.");
  }

  const linksInCategory = links.filter((l) => l.category_id === activeCategory);

  return (
    <div className="max-w-5xl mx-auto px-6 pt-16 pb-24 md:pl-64">
      {/* Fixed left panel for category suggestions */}
      <aside className="hidden md:block fixed left-6 top-32 w-52">
        <div className="bg-surface border border-line rounded-lg p-4">
          <h3 className="font-mono text-xs uppercase text-ink-faint mb-2">
            Want a new category?
          </h3>
          <form onSubmit={handleRequestCategory} className="space-y-2 mb-3">
            <input
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder="e.g. anime"
              className="w-full bg-bg-alt border border-line rounded px-2 py-1.5 text-xs focus:outline-none focus:border-ink-faint transition"
            />
            <button
              type="submit"
              className="w-full text-xs font-mono bg-tag text-[#1a2015] font-semibold py-1.5 rounded hover:brightness-110 transition"
            >
              Vote for it
            </button>
          </form>
          {requestStatus && (
            <p className="text-[11px] text-ink-faint mb-3">{requestStatus}</p>
          )}

          {pendingRequests.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase text-ink-faint">
                Trending requests
              </p>
              {pendingRequests.map((r) => (
                <div key={r.name}>
                  <div className="flex justify-between text-[11px] text-ink-dim mb-0.5">
                    <span>#{r.name}</span>
                    <span className="font-mono text-ink-faint">
                      {r.request_count}/10
                    </span>
                  </div>
                  <div className="h-1 bg-bg-alt rounded-full overflow-hidden">
                    <div
                      className="h-full bg-tag"
                      style={{
                        width: `${Math.min(100, (r.request_count / 10) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      <h1 className="font-display font-bold text-3xl mb-2">Util Sites</h1>
      <p className="text-ink-dim mb-8">
        Community-dropped links, sorted by category.
      </p>

      <div className="flex gap-2 flex-wrap mb-8">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`text-xs font-mono px-3 py-1.5 rounded-full border transition ${
              activeCategory === cat.id
                ? "border-tag text-tag bg-tag/10"
                : "border-line text-ink-dim hover:border-ink-faint"
            }`}
          >
            #{cat.name}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowAddForm((v) => !v)}
        className="mb-6 text-xs font-mono px-4 py-2 rounded-full border border-tag/40 text-tag hover:bg-tag/10 transition"
      >
        {showAddForm ? "Cancel" : "+ Drop a link"}
      </button>

      {showAddForm && (
        <form
          onSubmit={handleAddLink}
          className="bg-surface border border-line rounded-lg p-4 mb-8 space-y-3 max-w-md"
        >
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-bg-alt border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-ink-faint transition"
          />
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full bg-bg-alt border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-ink-faint transition"
          />
          {error && <p className="text-flag text-xs">{error}</p>}
          <button
            type="submit"
            className="text-xs font-mono bg-tag text-[#1a2015] font-semibold px-4 py-2 rounded hover:brightness-110 transition"
          >
            Post it
          </button>
        </form>
      )}

      <div className="space-y-2">
        {linksInCategory.map((link) => (
          <div
            key={link.id}
            className="bg-surface border border-line rounded-lg px-4 py-3 flex items-center justify-between gap-3"
          >
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:text-tag transition truncate"
            >
              {link.title || link.url}
            </a>
            <div className="flex gap-3 flex-shrink-0">
              {link.submitted_by === userId ? (
                <button
                  onClick={async () => {
                    await supabase
                      .from("useful_links")
                      .delete()
                      .eq("id", link.id);
                    router.refresh();
                  }}
                  className="text-xs text-flag hover:brightness-110 transition"
                >
                  Delete
                </button>
              ) : (
                <button
                  onClick={() => reportLink(link.id)}
                  className="text-xs text-ink-faint hover:text-ink-dim transition"
                >
                  Report
                </button>
              )}
            </div>
          </div>
        ))}
        {linksInCategory.length === 0 && (
          <p className="text-sm text-ink-faint">
            Nothing here yet — be the first to drop one.
          </p>
        )}
      </div>
    </div>
  );
}
