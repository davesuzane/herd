// src/app/herdis/page.tsx
import { createClient } from "@/utils/supabase/server";
import HerdisClient from "@/components/HerdisClient";
import { computeHerdiScore } from "@/utils/herdiScore";

export default async function HerdisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.is_admin ?? false;
  }

  const { data: herdis, error: herdisError } = await supabase
    .from("herdis")
    .select(
      "id, video_url, thumbnail_url, caption, view_count, profile_id, created_at, profiles!herdis_profile_id_fkey(username)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (herdisError) console.error("Herdis fetch error:", herdisError);

  const ids = (herdis || []).map((h) => h.id);

  const { data: likeCounts } = ids.length
    ? await supabase
        .from("herdis_like_counts")
        .select("herdi_id, like_count")
        .in("herdi_id", ids)
    : { data: [] };
  const { data: commentCounts } = ids.length
    ? await supabase
        .from("herdis_comment_counts")
        .select("herdi_id, comment_count")
        .in("herdi_id", ids)
    : { data: [] };

  const likeMap = new Map(
    (likeCounts || []).map((l) => [l.herdi_id, l.like_count]),
  );
  const commentMap = new Map(
    (commentCounts || []).map((c) => [c.herdi_id, c.comment_count]),
  );

  let likedIds = new Set<string>();
  if (user) {
    const { data: myLikes } = await supabase
      .from("herdis_likes")
      .select("herdi_id")
      .eq("user_id", user.id);
    likedIds = new Set((myLikes || []).map((l) => l.herdi_id));
  }

  const items = (herdis || [])
    .map((h: any) => {
      const likeCount = likeMap.get(h.id) ?? 0;
      const commentCount = commentMap.get(h.id) ?? 0;
      const viewCount = h.view_count ?? 0;
      return {
        id: h.id,
        videoUrl: h.video_url,
        thumbnailUrl: h.thumbnail_url,
        caption: h.caption,
        username: h.profiles?.username ?? "someone",
        likeCount,
        liked: likedIds.has(h.id),
        viewCount,
        score: computeHerdiScore(
          likeCount,
          viewCount,
          commentCount,
          h.created_at,
        ),
      };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <HerdisClient
      items={items}
      currentUserId={user?.id ?? null}
      isAdmin={isAdmin}
    />
  );
}
