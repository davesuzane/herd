// src/app/api/quick-account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const admin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 h"), // 3 quick accounts per IP per hour
});

function generateCode() {
  let code = "";
  for (let i = 0; i < 10; i++) code += Math.floor(Math.random() * 10);
  return code;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many quick accounts from this network — try again later." },
      { status: 429 },
    );
  }

  const { turnstileToken } = await req.json();
  if (!turnstileToken)
    return NextResponse.json({ error: "Captcha required." }, { status: 400 });

  const verifyRes = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${turnstileToken}`,
    },
  );
  const verifyData = await verifyRes.json();
  if (!verifyData.success)
    return NextResponse.json(
      { error: "Captcha failed, try again." },
      { status: 400 },
    );

  let code = "";
  let email = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateCode();
    email = `guest-${code}@guest.sulladeal.internal`;
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("username", `guest-${code}`)
      .maybeSingle();
    if (!existing) break;
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: code,
    email_confirm: true, // synthetic email, never actually needs confirming
    user_metadata: { is_guest: true },
  });

  if (error || !created.user) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create account." },
      { status: 400 },
    );
  }

  await admin
    .from("profiles")
    .update({ is_guest: true })
    .eq("id", created.user.id);

  return NextResponse.json({ code, email });
}
