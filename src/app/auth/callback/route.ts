// src/app/auth/callback/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data?.user) {
      await supabase
        .from("profiles")
        .update({ is_guest: false })
        .eq("id", data.user.id);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
