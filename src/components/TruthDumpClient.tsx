// src/components/TruthDumpClient.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Report = {
  id: string;
  report_type: "claim" | "local_issue";
  title: string;
  source_url: string | null;
  status: string;
  re_review_requested: boolean;
  created_at: string;
};

const PAGE_SIZE = 10;

function isValidUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function TruthDumpClient({ reports }: { reports: Report[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "claim" | "local_issue">("all");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [reportType, setReportType] = useState<"claim" | "local_issue">(
    "claim",
  );
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  const filtered =
    filter === "all"
      ? reports
      : reports.filter((r) => r.report_type === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?redirect=/truthdump");
      return;
    }
    if (title.trim().length < 5) {
      setError("Give it a real title.");
      return;
    }
    if (body.trim().length < 20) {
      setError(
        "Write enough for someone to actually understand the claim or issue.",
      );
      return;
    }
    if (sourceUrl && !isValidUrl(sourceUrl)) {
      setError("Source link must be a valid URL.");
      return;
    }

    const { data: created, error } = await supabase
      .from("truthdump_reports")
      .insert({
        report_type: reportType,
        title,
        source_url: sourceUrl || null,
        body,
        submitted_by: user.id,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/truthdump/${created.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 pt-16 pb-24">
      <h1 className="font-display font-bold text-3xl mb-2">TruthDump</h1>
      <p className="text-ink-dim mb-8">
        Claims and local issues, investigated in the open. Submissions are
        anonymous.
      </p>

      <div className="flex gap-2 mb-6">
        {(["all", "claim", "local_issue"] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={`text-xs font-mono px-3 py-1.5 rounded-full border transition ${
              filter === f
                ? "border-flag text-flag bg-flag/10"
                : "border-line text-ink-dim hover:border-ink-faint"
            }`}
          >
            {f === "all" ? "All" : f === "claim" ? "Claims" : "Local issues"}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowForm((v) => !v)}
        className="mb-6 text-xs font-mono px-4 py-2 rounded-full border border-flag/40 text-flag hover:bg-flag/10 transition"
      >
        {showForm ? "Cancel" : "+ Submit a report"}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-line rounded-lg p-4 mb-8 space-y-3"
        >
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={reportType === "claim"}
                onChange={() => setReportType("claim")}
              />{" "}
              Claim
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={reportType === "local_issue"}
                onChange={() => setReportType("local_issue")}
              />{" "}
              Local issue
            </label>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-bg-alt border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-flag transition"
          />
          {reportType === "claim" && (
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="Source link (article, tweet, video) — optional"
              className="w-full bg-bg-alt border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-flag transition"
            />
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              reportType === "claim"
                ? "What's missing, wrong, or needs context? Or share your own account."
                : "Describe the issue and where it is."
            }
            rows={4}
            className="w-full bg-bg-alt border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-flag transition"
          />
          {error && <p className="text-flag text-xs">{error}</p>}
          <button
            type="submit"
            className="text-xs font-mono bg-flag text-white font-semibold px-4 py-2 rounded hover:brightness-110 transition"
          >
            Post anonymously
          </button>
        </form>
      )}

      <div className="space-y-2">
        {pageItems.map((r) => (
          <Link
            key={r.id}
            href={`/truthdump/${r.id}`}
            className="block bg-surface border border-line rounded-lg p-4 hover:border-flag/50 transition"
          >
            <div className="flex justify-between items-start gap-3">
              <span className="text-sm">{r.title}</span>
              <div className="flex gap-2 flex-shrink-0">
                {r.re_review_requested && (
                  <span className="text-[10px] font-mono uppercase bg-tag/15 text-tag px-2 py-0.5 rounded-full">
                    Re-review
                  </span>
                )}
                <span className="text-[10px] font-mono uppercase bg-surface-2 text-ink-faint px-2 py-0.5 rounded-full">
                  {r.status}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-ink-faint">
              {r.report_type === "claim" ? "Claim" : "Local issue"}
            </span>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-ink-faint">Nothing here yet.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-xs font-mono px-3 py-1.5 rounded-full border border-line text-ink-dim disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs font-mono text-ink-faint">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="text-xs font-mono px-3 py-1.5 rounded-full border border-line text-ink-dim disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
