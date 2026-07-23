// src/app/api/[id]/page.tsx
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import VoteButtons from "@/components/VoteButtons";
import BoostButton from "@/components/BoostButton";
import Reviews from "@/components/Reviews";
import CopyLinkButton from "@/components/CopyLinkButton";
import DeleteApiButton from "@/components/DeleteApiButton";

export default async function ApiDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: api } = await supabase
    .from("apis")
    .select("*")
    .eq("id", id)
    .single();
  const { data: images } = await supabase
    .from("api_images")
    .select("image_url")
    .eq("api_id", id);
  const { data: apiTags } = await supabase
    .from("api_tags")
    .select("tags(name)")
    .eq("api_id", id);

  if (!api)
    return (
      <div className="max-w-2xl mx-auto mt-24 px-6 text-ink-dim">
        Not found.
      </div>
    );

  const tags = (apiTags || []).map((t: any) => t.tags?.name).filter(Boolean);
  const isOwner = user?.id === api.submitted_by;

  return (
    <main className="max-w-2xl mx-auto px-6 pt-16 pb-24">
      <div className="flex justify-between items-start mb-2">
        <h1 className="font-display font-bold text-3xl">{api.name}</h1>
        {api.pricing_type === "paid" && (
          <span className="text-xs font-mono uppercase bg-tag/15 text-tag px-2 py-1 rounded-full whitespace-nowrap">
            {api.pricing_note || "Paid"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <p className="text-sm font-mono text-ink-faint">{api.base_url}</p>
        <CopyLinkButton url={api.base_url} />
      </div>

      <p className="text-ink-dim leading-relaxed mb-4">{api.description}</p>

      {tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {tags.map((t, i) => (
            <span
              key={i}
              className="text-xs font-mono border border-line rounded-full px-3 py-1 text-ink-dim"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {images && images.length > 0 && (
        <div className="flex gap-3 overflow-x-auto mb-6 pb-1">
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img.image_url}
              alt=""
              className="h-44 rounded-lg border border-line flex-shrink-0"
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-line">
        {isOwner ? (
          <>
            <span className="text-xs font-mono text-ink-faint">
              This is your listing
            </span>
            <Link
              href={`/api/${api.id}/edit`}
              className="text-xs font-mono px-3 py-1.5 rounded-full border border-line text-ink-dim hover:border-ink-faint transition"
            >
              Edit
            </Link>
            <DeleteApiButton apiId={api.id} />
          </>
        ) : (
          <>
            <VoteButtons apiId={api.id} />
            <BoostButton apiId={api.id} />
          </>
        )}
      </div>

      <Reviews apiId={api.id} isOwner={isOwner} />
    </main>
  );
}
