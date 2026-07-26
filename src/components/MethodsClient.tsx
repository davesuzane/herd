// src/components/MethodsClient.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import DynamicFields, { type FieldEntry } from "./DynamicFields";
import Pagination from "./Pagination";

const PAGE_SIZE = 10;
const PREVIEW_LENGTH = 140;

type Category = { id: string; name: string };
type Method = {
  id: string;
  title: string;
  body: string;
  category_id: string;
  submitted_by: string;
  created_at: string;
  extra_fields?: FieldEntry[];
};
type VoteCount = { method_id: string; helpful_count: number };
type PendingRequest = { name: string; request_count: number };

export default function MethodsClient({
  categories,
  methods,
  voteCounts,
  pendingRequests,
}: {
  categories: Category[];
  methods: Method[];
  voteCounts: VoteCount[];
  pendingRequests: PendingRequest[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(
    categories[0]?.id ?? "",
  );
  const [page, setPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [extraFields, setExtraFields] = useState<FieldEntry[]>([]);
  const [error, setError] = useState("");

  const [requestText, setRequestText] = useState("");
  const [requestStatus, setRequestStatus] = useState("");

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeCategory]);

  function helpfulCount(methodId: string) {
    return voteCounts.find((v) => v.method_id === methodId)?.helpful_count ?? 0;
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!userId) {
      router.push("/login?redirect=/methods");
      return;
    }
    if (title.trim().length < 5) {
      setError("Give it a real title.");
      return;
    }
    if (body.trim().length < 20) {
      setError("Write at least a couple sentences.");
      return;
    }
    if (!activeCategory) {
      setError("Pick a category first.");
      return;
    }

    const cleanFields = extraFields.filter(
      (f) => f.label.trim() && f.value.trim(),
    );

    const { error } = await supabase.from("methods").insert({
      category_id: activeCategory,
      title,
      body,
      submitted_by: userId,
      extra_fields: cleanFields,
    });
    if (error) {
      setError(error.message);
      return;
    }

    setTitle("");
    setBody("");
    setExtraFields([]);
    setShowAddForm(false);
    router.refresh();
  }

  async function handleRequestCategory(e: React.FormEvent) {
    e.preventDefault();
    setRequestStatus("");
    if (!userId) {
      router.push("/login?redirect=/methods");
      return;
    }
    const normalized = requestText.trim().toLowerCase();
    if (!normalized) return;

    const { error } = await supabase
      .from("method_category_requests")
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

  const methodsInCategory = methods
    .filter((m) => m.category_id === activeCategory)
    .sort((a, b) => helpfulCount(b.id) - helpfulCount(a.id));
  const totalPages = Math.max(
    1,
    Math.ceil(methodsInCategory.length / PAGE_SIZE),
  );
  const pageMethods = methodsInCategory.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <div className="max-w-5xl mx-auto px-6 pt-16 pb-24 md:pl-64">
      <aside className="hidden md:block fixed left-6 top-32 w-52">
        <div className="bg-surface border border-methods/40 rounded-lg p-4">
          <h3 className="font-mono text-xs uppercase text-ink-faint mb-2">
            Want a new category?
          </h3>
          <form onSubmit={handleRequestCategory} className="space-y-2 mb-3">
            <input
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder="e.g. writing"
              className="w-full bg-bg-alt border border-line rounded px-2 py-1.5 text-xs focus:outline-none focus:border-methods transition"
            />
            <button
              type="submit"
              className="w-full text-xs font-mono bg-methods text-bg font-semibold py-1.5 rounded hover:brightness-110 transition"
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
                      className="h-full bg-methods"
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

      <h1 className="font-display font-bold text-3xl mb-2">
        <span className="text-methods">Methods</span>
      </h1>
      <p className="text-ink-dim mb-8">
        Techniques the herd has actually used — sorted by how many found it
        helpful.
      </p>

      <div className="flex gap-2 flex-wrap mb-8">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`text-xs font-mono px-3 py-1.5 rounded-full border transition ${
              activeCategory === cat.id
                ? "border-methods text-methods bg-methods/10"
                : "border-line text-ink-dim hover:border-ink-faint"
            }`}
          >
            #{cat.name}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowAddForm((v) => !v)}
        className="mb-6 text-xs font-mono px-4 py-2 rounded-full border border-methods/40 text-methods hover:bg-methods/10 transition"
      >
        {showAddForm ? "Cancel" : "+ Share a method"}
      </button>

      {showAddForm && (
        <form
          onSubmit={handlePost}
          className="bg-surface border border-line rounded-lg p-4 mb-8 space-y-3 max-w-lg"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-bg-alt border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-methods transition"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Walk through it"
            rows={5}
            className="w-full bg-bg-alt border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-methods transition"
          />
          <div>
            <label className="text-[10px] uppercase text-ink-faint block mb-2">
              Extra fields (optional)
            </label>
            <DynamicFields
              fields={extraFields}
              onChange={setExtraFields}
              accent="methods"
            />
          </div>
          {error && <p className="text-flag text-xs">{error}</p>}
          <button
            type="submit"
            className="text-xs font-mono bg-methods text-bg font-semibold px-4 py-2 rounded hover:brightness-110 transition"
          >
            Post it
          </button>
        </form>
      )}

      <div className="space-y-3">
        {pageMethods.map((method) => {
          const preview =
            method.body.length > PREVIEW_LENGTH
              ? method.body.slice(0, PREVIEW_LENGTH).trim() + "…"
              : method.body;
          return (
            <button
              key={method.id}
              onClick={() => router.push(`/methods/${method.id}`)}
              className="w-full text-left bg-surface border border-line rounded-lg p-4 hover:border-methods/50 transition"
            >
              <div className="flex justify-between items-start gap-3">
                <span className="font-mono text-sm">{method.title}</span>
                <span className="text-[10px] font-mono text-ink-faint whitespace-nowrap">
                  {helpfulCount(method.id)} found helpful
                </span>
              </div>
              <p className="text-xs text-ink-faint mt-2">{preview}</p>
              <span className="text-[10px] font-mono text-methods mt-2 inline-block">
                Open post →
              </span>
            </button>
          );
        })}
        {methodsInCategory.length === 0 && (
          <p className="text-sm text-ink-faint">
            Nothing here yet — be the first to share one.
          </p>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
