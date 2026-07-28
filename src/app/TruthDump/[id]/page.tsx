// src/app/truthdump/[id]/page.tsx
import { createClient } from "@/utils/supabase/server";
import TruthDumpDetailClient from "@/components/TruthDumpDetailClient";

export default async function TruthDumpDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: report } = await supabase
    .from("truthdump_reports")
    .select("*")
    .eq("id", id)
    .single();
  const { data: evidence } = await supabase
    .from("truthdump_evidence")
    .select("id, body, image_url, created_at")
    .eq("report_id", id)
    .order("created_at", { ascending: true });

  if (!report)
    return (
      <div className="max-w-2xl mx-auto mt-24 px-6 text-ink-dim">
        Not found.
      </div>
    );

  const isOwner = user?.id === report.submitted_by;

  return (
    <TruthDumpDetailClient
      report={report}
      evidence={evidence || []}
      isOwner={isOwner}
    />
  );
}
