// src/app/truthdump/page.tsx
import { createClient } from "@/utils/supabase/server";
import TruthDumpClient from "@/components/TruthDumpClient";

export default async function TruthDumpPage() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("truthdump_reports")
    .select(
      "id, report_type, title, source_url, status, re_review_requested, created_at",
    )
    .order("created_at", { ascending: false });

  return <TruthDumpClient reports={reports || []} />;
}
