// src/app/api/herdis/more/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { computeHerdiScore } from "@/utils/herdiScore";

export async function POST(req: NextRequest) {
  const { excludeIds }: { excludeIds: string[] } = await req.json();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: herdis } = await supabase
    .from("herdis")
    .select(
      "id, video_url, thumbnail_url, caption, view_count, profile_id, created_at, profiles!herdis_profile_id_fkey(username)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const filtered = (herdis || []).filter((h) => !excludeIds.includes(h.id));
  if (filtered.length === 0) return NextResponse.json({ items: [] });

  const ids = filtered.map((h) => h.id);
  const { data: likeCounts } = await supabase
    .from("herdis_like_counts")
    .select("herdi_id, like_count")
    .in("herdi_id", ids);
  const { data: commentCounts } = await supabase
    .from("herdis_comment_counts")
    .select("herdi_id, comment_count")
    .in("herdi_id", ids);
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

  const items = filtered
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
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return NextResponse.json({ items });
}
