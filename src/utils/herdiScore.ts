// src/utils/herdiScore.ts
export function computeHerdiScore(
  likeCount: number,
  viewCount: number,
  commentCount: number,
  createdAt: string,
): number {
  const ageHours =
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);

  // Likes count for more than views, comments count for more than likes —
  // a comment is a stronger signal of engagement than a passive view.
  const raw = likeCount * 3 + commentCount * 5 + viewCount * 1;

  // Recency decay — same shape as Reddit/HN "hot" ranking, so a week-old
  // video with a lot of engagement doesn't bury everything posted today.
  const decay = Math.pow(ageHours + 2, 1.3);
  const base = raw / decay;

  // A little randomness so the order isn't perfectly identical every load,
  // while still generally favoring higher-scoring content.
  const jitter = 0.85 + Math.random() * 0.3;
  return base * jitter;
}
