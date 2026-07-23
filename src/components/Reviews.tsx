// src/components/Reviews.tsx
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Review = {
  id: string;
  user_id: string;
  rating: number;
  body: string | null;
  created_at: string;
  profiles: { username: string } | null;
};

export default function Reviews({
  apiId,
  isOwner = false,
}: {
  apiId: string;
  isOwner?: boolean;
}) {
  const supabase = createClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [avg, setAvg] = useState<{
    avg_rating: number;
    review_count: number;
  } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const { data } = await supabase
      .from("reviews")
      .select("id, user_id, rating, body, created_at, profiles(username)")
      .eq("api_id", apiId)
      .order("created_at", { ascending: false });
    setReviews((data as any) || []);

    const { data: ratingData } = await supabase
      .from("api_ratings")
      .select("avg_rating, review_count")
      .eq("api_id", apiId)
      .single();
    setAvg(ratingData);
  }

  useEffect(() => {
    load();
  }, [apiId]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      alert("Sign in first.");
      return;
    }

    await supabase
      .from("reviews")
      .upsert(
        { api_id: apiId, user_id: userId, rating, body },
        { onConflict: "api_id,user_id" },
      );
    setBody("");
    setEditingId(null);
    load();
  }

  function startEdit(r: Review) {
    setEditingId(r.id);
    setRating(r.rating);
    setBody(r.body || "");
  }

  async function deleteReview(id: string) {
    if (!confirm("Delete your review?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    load();
  }

  async function reportReview(reviewId: string) {
    if (!userId) {
      alert("Sign in first.");
      return;
    }
    const reason =
      prompt("Why are you reporting this review? (optional)") || null;
    await supabase
      .from("review_reports")
      .insert({ review_id: reviewId, reported_by: userId, reason });
    alert("Reported. Thanks — we'll take a look.");
  }

  const myReview = reviews.find((r) => r.user_id === userId);

  return (
    <div className="mt-8">
      <h3 className="font-semibold mb-2">
        Reviews {avg && `— ${avg.avg_rating} ★ (${avg.review_count})`}
      </h3>
      {!isOwner && (
        <form
          onSubmit={submitReview}
          className="bg-surface border border-line rounded-lg p-4 mb-6 space-y-3"
        >
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setRating(n)}
                className={n <= rating ? "text-yellow-500" : "text-gray-300"}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="How was it?"
            className="w-full border rounded p-2 text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="text-sm bg-black text-white px-3 py-1 rounded"
            >
              {editingId
                ? "Update review"
                : myReview
                  ? "Update review"
                  : "Post review"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setBody("");
                  setRating(5);
                }}
                className="text-sm text-gray-500"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="border-b pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-yellow-500">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </span>
                <span className="text-gray-500">
                  {r.profiles?.username ?? "someone"}
                </span>
              </div>
              <div className="flex gap-2 text-xs">
                {r.user_id === userId ? (
                  <>
                    <button
                      onClick={() => startEdit(r)}
                      className="text-gray-500 underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteReview(r.id)}
                      className="text-red-500 underline"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => reportReview(r.id)}
                    className="text-gray-400 underline"
                  >
                    Report
                  </button>
                )}
              </div>
            </div>
            {r.body && <p className="text-sm mt-1">{r.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
