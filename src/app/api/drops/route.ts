// src/app/api/drops/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import bcrypt from 'bcryptjs'

const admin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { storagePath, fileName, fileSize, mimeType, hours, customPassword } = await req.json()

  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()

  let accessCode: string | null = null
  let passwordHash: string | null = null

  if (customPassword) {
    passwordHash = await bcrypt.hash(customPassword, 10)
  } else {
    accessCode = generateCode()
  }

  const { data: drop, error } = await admin.from('file_drops').insert({
    owner_id: user.id,
    storage_path: storagePath,
    file_name: fileName,
    file_size: fileSize,
    mime_type: mimeType,
    access_code: accessCode,
    password_hash: passwordHash,
    expires_at: expiresAt,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ id: drop.id, code: accessCode })
}