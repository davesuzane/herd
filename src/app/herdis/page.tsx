// src/app/herdis/page.tsx
import { createClient } from "@/utils/supabase/server";
import HerdisClient from "@/components/HerdisClient";

export default async function HerdisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: herdis } = await supabase
    .from("herdis")
    .select(
      "id, video_url, thumbnail_url, caption, view_count, profile_id, created_at, profiles(username), herdis_like_counts(like_count)",
    )
    .order("created_at", { ascending: false })
    .limit(30);

  let likedIds = new Set<string>();
  if (user) {
    const { data: myLikes } = await supabase
      .from("herdis_likes")
      .select("herdi_id")
      .eq("user_id", user.id);
    likedIds = new Set((myLikes || []).map((l) => l.herdi_id));
  }

  const items = (herdis || []).map((h: any) => ({
    id: h.id,
    videoUrl: h.video_url,
    thumbnailUrl: h.thumbnail_url,
    caption: h.caption,
    username: h.profiles?.username ?? "someone",
    likeCount: h.herdis_like_counts?.[0]?.like_count ?? 0,
    liked: likedIds.has(h.id),
    viewCount: h.view_count ?? 0,
  }));

  return <HerdisClient items={items} currentUserId={user?.id ?? null} />;
}
