// src/components/DeleteApiButton.tsx
"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function DeleteApiButton({ apiId }: { apiId: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete() {
    if (
      !confirm(
        "Delete this listing permanently? Votes, reviews, and images go with it.",
      )
    )
      return;
    const { error } = await supabase.from("apis").delete().eq("id", apiId);
    if (error) {
      alert(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs font-mono px-3 py-1.5 rounded-full border border-flag/40 text-flag hover:bg-flag/10 transition"
    >
      Delete
    </button>
  );
}
