// src/app/api/vote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createClient } from "@/utils/supabase/server";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 votes per minute per user
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { success } = await ratelimit.limit(user.id);
  if (!success)
    return NextResponse.json({ error: "Slow down" }, { status: 429 });

  const { apiId, voteType } = await req.json();
  if (!["safe", "flagged"].includes(voteType)) {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  }

  const { error } = await supabase
    .from("votes")
    .upsert(
      { api_id: apiId, user_id: user.id, vote_type: voteType },
      { onConflict: "api_id,user_id" },
    );

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
