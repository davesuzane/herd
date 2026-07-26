// src/app/methods/[id]/page.tsx
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import MethodDetailActions from "@/components/MethodDetailActions";

export default async function MethodDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: method } = await supabase
    .from("methods")
    .select("*")
    .eq("id", id)
    .single();
  const { data: category } = method
    ? await supabase
        .from("method_categories")
        .select("name")
        .eq("id", method.category_id)
        .single()
    : { data: null };
  const { data: voteCount } = await supabase
    .from("method_vote_counts")
    .select("helpful_count")
    .eq("method_id", id)
    .maybeSingle();

  if (!method)
    return (
      <div className="max-w-2xl mx-auto mt-24 px-6 text-ink-dim">
        Not found.
      </div>
    );

  const isOwner = user?.id === method.submitted_by;

  return (
    <main className="max-w-2xl mx-auto px-6 pt-16 pb-24">
      <Link
        href="/methods"
        className="text-xs font-mono text-methods hover:brightness-110 transition"
      >
        ← Back to Methods
      </Link>

      <div className="flex justify-between items-start mt-4 mb-2">
        <h1 className="font-display font-bold text-2xl">{method.title}</h1>
        <span className="text-[10px] font-mono text-ink-faint whitespace-nowrap">
          {voteCount?.helpful_count ?? 0} found helpful
        </span>
      </div>

      {category && (
        <span className="text-xs font-mono border border-methods/40 text-methods rounded-full px-3 py-1 inline-block mb-4">
          #{category.name}
        </span>
      )}

      <p className="text-ink-dim leading-relaxed whitespace-pre-wrap mb-6">
        {method.body}
      </p>

      {method.extra_fields && method.extra_fields.length > 0 && (
        <div className="bg-surface border border-line rounded-lg p-4 mb-6 space-y-2">
          {method.extra_fields.map((f: any, i: number) => (
            <div key={i} className="text-sm flex items-center">
              <span className="text-ink-faint font-mono">{f.label}:</span>
              <span className="text-ink-dim ml-1">{f.value}</span>
              {f.copyable && (
                <span className="ml-2">
                  {/* client component below handles the actual copy interaction */}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <MethodDetailActions
        methodId={method.id}
        isOwner={isOwner}
        extraFields={method.extra_fields || []}
      />
    </main>
  );
}
