// src/app/api/boost/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const { apiId } = await req.json()
  const origin = req.headers.get('origin')

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'Boost listing — 7 days' },
        unit_amount: 500, // $5.00
      },
      quantity: 1,
    }],
    success_url: `${origin}/api/${apiId}?boosted=1`,
    cancel_url: `${origin}/api/${apiId}`,
    metadata: { apiId, type: 'boost' },
  })

  return NextResponse.json({ url: session.url })
}