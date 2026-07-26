// src/app/methods/page.tsx
import { createClient } from "@/utils/supabase/server";
import MethodsClient from "@/components/MethodsClient";

export default async function MethodsPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("method_categories")
    .select("*")
    .order("name");
  const { data: methods } = await supabase
    .from("methods")
    .select(
      "id, title, body, category_id, submitted_by, created_at, extra_fields",
    )
    .order("created_at", { ascending: false });
  const { data: voteCounts } = await supabase
    .from("method_vote_counts")
    .select("*");
  const { data: pendingRequests } = await supabase
    .from("method_category_request_counts")
    .select("*")
    .limit(10);

  return (
    <MethodsClient
      categories={categories || []}
      methods={methods || []}
      voteCounts={voteCounts || []}
      pendingRequests={pendingRequests || []}
    />
  );
}
