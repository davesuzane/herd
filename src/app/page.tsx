// src/app/page.tsx
import { createClient } from "@/utils/supabase/server";
import HomeClient from "@/components/HomeClient";

export default async function Home() {
  const supabase = await createClient();

  const { data: apis } = await supabase
    .from("apis")
    .select(
      "id, name, base_url, description, scan_result, pricing_type, pricing_note, boosted_until, submitted_by, api_tags(tags(name))",
    )
    .order("created_at", { ascending: false });

  const { data: topTags } = await supabase
    .from("tag_counts")
    .select("*")
    .limit(10);
  const { count: totalVotes } = await supabase
    .from("votes")
    .select("id", { count: "exact", head: true });

  const normalized = (apis || []).map((a) => ({
    ...a,
    tags:
      (a as any).api_tags?.map((t: any) => t.tags?.name).filter(Boolean) || [],
  }));

  return (
    <main className="max-w-6xl mx-auto px-6 pt-16 pb-24">
      <HomeClient
        apis={normalized}
        topTags={topTags || []}
        totalVotes={totalVotes ?? 0}
      />
    </main>
  );
}
