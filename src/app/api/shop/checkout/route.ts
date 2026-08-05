// src/app/api/shop/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { itemId } = await req.json();

  const { data: item } = await supabase
    .from("shop_items")
    .select("*")
    .eq("id", itemId)
    .eq("status", "active")
    .single();
  if (!item)
    return NextResponse.json({ error: "Item not available." }, { status: 404 });

  const { data: seller } = await supabase
    .from("profiles")
    .select("stripe_connect_account_id, stripe_connect_onboarded")
    .eq("id", item.seller_id)
    .single();
  if (!seller?.stripe_connect_onboarded || !seller.stripe_connect_account_id) {
    return NextResponse.json(
      { error: "This seller hasn't finished payment setup yet." },
      { status: 400 },
    );
  }

  const feePercent = Number(process.env.PLATFORM_FEE_PERCENT ?? "10");
  const platformFeeCents = Math.round(item.price_cents * (feePercent / 100));

  const { data: order } = await supabase
    .from("shop_orders")
    .insert({
      item_id: item.id,
      buyer_id: user.id,
      seller_id: item.seller_id,
      amount_cents: item.price_cents,
      platform_fee_cents: platformFeeCents,
      status: "pending",
    })
    .select()
    .single();

  const origin = req.headers.get("origin");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: item.title },
          unit_amount: item.price_cents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFeeCents,
      transfer_data: { destination: seller.stripe_connect_account_id },
    },
    success_url: `${origin}/shop?purchased=1`,
    cancel_url: `${origin}/shop`,
    metadata: { type: "shop_order", orderId: order.id, itemId: item.id },
  });

  await supabase
    .from("shop_orders")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", order.id);

  return NextResponse.json({ url: session.url });
}
