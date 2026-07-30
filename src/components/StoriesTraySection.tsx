// src/components/StoriesTraySection.tsx
import { createClient } from "@/utils/supabase/server";
import StoriesTray from "./StoriesTray";

export default async function StoriesTraySection() {
  const supabase = await createClient();

  const { data: activeStories } = await supabase
    .from("stories")
    .select(
      "id, profile_id, media_url, media_type, created_at, profiles(username, avatar_url)",
    )
    .order("created_at", { ascending: false });

  const byProfile = new Map<string, any>();
  for (const s of activeStories || []) {
    const key = s.profile_id;
    if (!byProfile.has(key)) {
      byProfile.set(key, {
        profileId: s.profile_id,
        username: (s as any).profiles?.username ?? "someone",
        avatarUrl: (s as any).profiles?.avatar_url ?? null,
        stories: [],
      });
    }
    byProfile
      .get(key)
      .stories.push({
        id: s.id,
        media_url: s.media_url,
        media_type: s.media_type,
      });
  }

  return <StoriesTray people={[...byProfile.values()]} />;
}
