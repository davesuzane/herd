// src/app/connections/page.tsx
import { createClient } from "@/utils/supabase/server";
import ConnectionsClient from "@/components/ConnectionsClient";

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return (
      <div className="max-w-md mx-auto mt-24 px-6 text-ink-dim">
        Sign in to see your people.
      </div>
    );

  const { data: connections } = await supabase
    .from("connections")
    .select(
      "added_id, profiles!connections_added_id_fkey(username, avatar_url)",
    )
    .eq("owner_id", user.id);

  const people = (connections || []).map((c: any) => ({
    id: c.added_id,
    username: c.profiles?.username ?? "someone",
    avatarUrl: c.profiles?.avatar_url ?? null,
  }));

  return <ConnectionsClient people={people} />;
}
