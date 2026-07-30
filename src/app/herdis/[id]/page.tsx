// src/app/herdis/[id]/page.tsx
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function HerdiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: herdi } = await supabase
    .from("herdis")
    .select(
      "id, video_url, thumbnail_url, caption, view_count, profiles(username)",
    )
    .eq("id", id)
    .single();

  if (!herdi)
    return (
      <div className="max-w-md mx-auto mt-24 px-6 text-ink-dim">Not found.</div>
    );

  await supabase.rpc("increment_herdi_view", { target_id: id });

  return (
    <div className="max-w-md mx-auto px-6 pt-16 pb-24">
      <video
        src={herdi.video_url}
        poster={herdi.thumbnail_url ?? undefined}
        className="w-full rounded-lg"
        controls
        autoPlay
        loop
      />
      <Link
        href={`/u/${(herdi as any).profiles?.username}`}
        className="font-mono text-sm text-tag mt-3 inline-block"
      >
        @{(herdi as any).profiles?.username}
      </Link>
      {herdi.caption && (
        <p className="text-sm text-ink-dim mt-1">{herdi.caption}</p>
      )}
      <p className="text-xs text-ink-faint mt-2">{herdi.view_count} views</p>
      <Link
        href="/herdis"
        className="text-xs font-mono text-ink-faint hover:text-ink-dim transition mt-4 inline-block"
      >
        ← Back to Herdis
      </Link>
    </div>
  );
}
