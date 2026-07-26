// src/app/util-sites/page.tsx
import { createClient } from "@/utils/supabase/server";
import UtilSitesClient from "@/components/UtilSitesClient";

export default async function UtilSitesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("link_categories")
    .select("*")
    .order("name");
  const { data: links } = await supabase
    .from("useful_links")
    .select(
      "id, url, title, category_id, submitted_by, created_at, extra_fields",
    )
    .order("created_at", { ascending: false });
  const { data: pendingRequests } = await supabase
    .from("category_request_counts")
    .select("*")
    .limit(10);

  return (
    <UtilSitesClient
      categories={categories || []}
      links={links || []}
      pendingRequests={pendingRequests || []}
    />
  );
}
