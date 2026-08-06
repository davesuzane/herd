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

  const { itemIds }: { itemIds: string[] } = await req.json();
  if (!itemIds || itemIds.length === 0)
    return NextResponse.json({ error: "No items." }, { status: 400 });

  const { data: items } = await supabase
    .from("shop_items")
    .select("*")
    .in("id", itemIds)
    .eq("status", "active");
  if (!items || items.length === 0)
    return NextResponse.json(
      { error: "Items not available." },
      { status: 404 },
    );

  const sellerIds = new Set(items.map((i) => i.seller_id));
  if (sellerIds.size > 1)
    return NextResponse.json(
      { error: "All items in one checkout must be from the same seller." },
      { status: 400 },
    );

  const sellerId = items[0].seller_id;
  const { data: seller } = await supabase
    .from("profiles")
    .select("stripe_connect_account_id, stripe_connect_onboarded")
    .eq("id", sellerId)
    .single();
  if (!seller?.stripe_connect_onboarded || !seller.stripe_connect_account_id) {
    return NextResponse.json(
      { error: "This seller hasn't finished payment setup yet." },
      { status: 400 },
    );
  }

  const feePercent = Number(process.env.PLATFORM_FEE_PERCENT ?? "10");
  const totalCents = items.reduce((sum, i) => sum + i.price_cents, 0);
  const platformFeeCents = Math.round(totalCents * (feePercent / 100));

  const orderIds: string[] = [];
  for (const item of items) {
    const itemFee = Math.round(item.price_cents * (feePercent / 100));
    const { data: order } = await supabase
      .from("shop_orders")
      .insert({
        item_id: item.id,
        buyer_id: user.id,
        seller_id: sellerId,
        amount_cents: item.price_cents,
        platform_fee_cents: itemFee,
        status: "pending",
      })
      .select()
      .single();
    if (order) orderIds.push(order.id);
  }

  const origin = req.headers.get("origin");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.title },
        unit_amount: item.price_cents,
      },
      quantity: 1,
    })),
    payment_intent_data: {
      application_fee_amount: platformFeeCents,
      transfer_data: { destination: seller.stripe_connect_account_id },
    },
    success_url: `${origin}/shop?purchased=1`,
    cancel_url: `${origin}/shop/cart`,
    metadata: {
      type: "shop_order",
      orderIds: JSON.stringify(orderIds),
      itemIds: JSON.stringify(items.map((i) => i.id)),
    },
  });

  await supabase
    .from("shop_orders")
    .update({ stripe_checkout_session_id: session.id })
    .in("id", orderIds);

  return NextResponse.json({ url: session.url });
}
