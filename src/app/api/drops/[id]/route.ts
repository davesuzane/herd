// src/app/api/drops/[id]/access/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { code } = await req.json()

  const { data: drop } = await admin.from('file_drops').select('*').eq('id', id).single()
  if (!drop) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  if (new Date(drop.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This link has expired.' }, { status: 410 })
  }

  let valid = false
  if (drop.password_hash) {
    valid = await bcrypt.compare(code, drop.password_hash)
  } else if (drop.access_code) {
    valid = code === drop.access_code
  }

  if (!valid) return NextResponse.json({ error: 'Incorrect.' }, { status: 403 })

  const { data: signed, error } = await admin.storage.from('drops').createSignedUrl(drop.storage_path, 120)
  if (error || !signed) return NextResponse.json({ error: 'Could not generate download link.' }, { status: 500 })

  await admin.from('file_drops').update({ download_count: drop.download_count + 1 }).eq('id', id)

  return NextResponse.json({ url: signed.signedUrl })
}