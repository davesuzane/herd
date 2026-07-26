// src/components/MethodDetailActions.tsx
"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import CopyFieldButton from "./CopyFieldButton";
import type { FieldEntry } from "./DynamicFields";

export default function MethodDetailActions({
  methodId,
  isOwner,
  extraFields,
}: {
  methodId: string;
  isOwner: boolean;
  extraFields: FieldEntry[];
}) {
  const router = useRouter();
  const supabase = createClient();

  async function markHelpful() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirect=/methods/${methodId}`);
      return;
    }
    await supabase
      .from("method_votes")
      .insert({ method_id: methodId, user_id: user.id });
    router.refresh();
  }

  async function reportMethod() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirect=/methods/${methodId}`);
      return;
    }
    const reason = prompt("Why are you reporting this?") || null;
    await supabase
      .from("method_reports")
      .insert({ method_id: methodId, reported_by: user.id, reason });
    alert("Reported — thanks.");
  }

  async function deleteMethod() {
    if (!confirm("Delete this method?")) return;
    await supabase.from("methods").delete().eq("id", methodId);
    router.push("/methods");
  }

  return (
    <>
      {extraFields.some((f) => f.copyable) && (
        <div className="flex flex-wrap gap-x-4 mb-4">
          {extraFields
            .filter((f) => f.copyable)
            .map((f, i) => (
              <span key={i} className="text-xs text-ink-faint">
                {f.label}: <CopyFieldButton value={f.value} />
              </span>
            ))}
        </div>
      )}
      <div className="flex gap-3 pt-4 border-t border-line">
        <button
          onClick={markHelpful}
          className="text-xs font-mono px-3 py-1.5 rounded-full border border-safe-dim text-safe hover:bg-safe-dim transition"
        >
          Helpful
        </button>
        {isOwner ? (
          <button
            onClick={deleteMethod}
            className="text-xs text-flag hover:brightness-110 transition"
          >
            Delete
          </button>
        ) : (
          <button
            onClick={reportMethod}
            className="text-xs text-ink-faint hover:text-ink-dim transition"
          >
            Report
          </button>
        )}
      </div>
    </>
  );
}
7;
