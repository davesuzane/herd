// src/app/api/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { apiId } = await req.json();
  const origin = req.headers.get("origin");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Verified badge",
            description:
              "Manual review + a permanent trust badge on your listing",
          },
          unit_amount: 1500, // $15
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/api/${apiId}?verify_requested=1`,
    cancel_url: `${origin}/api/${apiId}`,
    metadata: { apiId, type: "verify" },
  });

  return NextResponse.json({ url: session.url });
}
