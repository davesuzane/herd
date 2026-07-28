// src/components/TruthDumpDetailClient.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Report = {
  id: string;
  report_type: string;
  title: string;
  source_url: string | null;
  body: string;
  status: string;
  re_review_requested: boolean;
  submitted_by: string;
};
type Evidence = {
  id: string;
  body: string;
  image_url: string | null;
  created_at: string;
};

export default function TruthDumpDetailClient({
  report,
  evidence,
  isOwner,
}: {
  report: Report;
  evidence: Evidence[];
  isOwner: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [items, setItems] = useState(evidence);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitEvidence(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirect=/truthdump/${report.id}`);
      return;
    }
    if (body.trim().length < 10) {
      setError("Add a bit more detail.");
      return;
    }

    setSubmitting(true);
    let imageUrl: string | null = null;

    if (file) {
      const filePath = `${report.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("truthdump-evidence")
        .upload(filePath, file);
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("truthdump-evidence")
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }
    }

    const { data: created, error } = await supabase
      .from("truthdump_evidence")
      .insert({
        report_id: report.id,
        body,
        image_url: imageUrl,
        submitted_by: user.id,
      })
      .select()
      .single();

    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }

    setItems((prev) => [...prev, created]);
    setBody("");
    setFile(null);
  }

  async function requestReReview() {
    await supabase
      .from("truthdump_reports")
      .update({ re_review_requested: true })
      .eq("id", report.id);
    router.refresh();
  }

  async function markResolved() {
    await supabase
      .from("truthdump_reports")
      .update({ status: "resolved", re_review_requested: false })
      .eq("id", report.id);
    router.refresh();
  }

  return (
    <main className="max-w-2xl mx-auto px-6 pt-16 pb-24">
      <div className="flex justify-between items-start mb-2">
        <h1 className="font-display font-bold text-2xl">{report.title}</h1>
        <span className="text-[10px] font-mono uppercase bg-surface-2 text-ink-faint px-2 py-0.5 rounded-full whitespace-nowrap">
          {report.status}
        </span>
      </div>
      <span className="text-xs font-mono text-flag">
        {report.report_type === "claim" ? "Claim" : "Local issue"}
      </span>

      {report.source_url && (
        <p className="mt-3">
          <a
            href={report.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-ink-faint hover:text-flag transition"
          >
            {report.source_url}
          </a>
        </p>
      )}

      <p className="text-ink-dim leading-relaxed mt-4 mb-6 whitespace-pre-wrap">
        {report.body}
      </p>

      {isOwner && report.status !== "resolved" && (
        <button
          onClick={markResolved}
          className="text-xs font-mono px-3 py-1.5 rounded-full border border-safe-dim text-safe hover:bg-safe-dim transition mb-6"
        >
          Mark resolved
        </button>
      )}
      {!isOwner && (
        <button
          onClick={requestReReview}
          className="text-xs font-mono px-3 py-1.5 rounded-full border border-tag/40 text-tag hover:bg-tag/10 transition mb-6"
        >
          {report.re_review_requested
            ? "Re-review already requested"
            : "Request re-review"}
        </button>
      )}

      <div className="border-t border-line pt-6">
        <h2 className="font-display font-semibold text-lg mb-4">
          Evidence & context ({items.length})
        </h2>

        <form
          onSubmit={submitEvidence}
          className="bg-surface border border-line rounded-lg p-4 mb-6 space-y-3"
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a source, correction, or perspective"
            rows={3}
            className="w-full bg-bg-alt border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-flag transition"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-xs text-ink-dim file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-surface-2 file:text-ink-dim file:text-xs"
          />
          {error && <p className="text-flag text-xs">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="text-xs font-mono bg-flag text-white font-semibold px-4 py-2 rounded hover:brightness-110 transition disabled:opacity-60"
          >
            {submitting ? "Posting…" : "Add evidence, anonymously"}
          </button>
        </form>

        <div className="space-y-3">
          {items.map((ev) => (
            <div
              key={ev.id}
              className="bg-surface border border-line rounded-lg p-4"
            >
              <p className="text-sm text-ink-dim leading-relaxed">{ev.body}</p>
              {ev.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ev.image_url}
                  alt=""
                  className="mt-3 rounded border border-line max-h-64"
                />
              )}
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-ink-faint">No evidence yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
