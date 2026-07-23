// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role — bypasses RLS, needed since no user is logged in during a webhook call
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const apiId = session.metadata?.apiId;
    const type = session.metadata?.type;

    if (apiId && type === "boost") {
      const boostedUntil = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      await supabase
        .from("apis")
        .update({ boosted_until: boostedUntil })
        .eq("id", apiId);
    }
  }

  return NextResponse.json({ received: true });
}
