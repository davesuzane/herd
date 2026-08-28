// src/app/d/[id]/page.tsx
import { createClient } from '@supabase/supabase-js'
import DropAccessClient from '@/components/DropAccessClient'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function DropRecipientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: drop } = await admin
    .from('file_drops')
    .select('id, file_name, mime_type, file_size, access_code, password_hash, expires_at')
    .eq('id', id)
    .single()

  if (!drop) {
    return <div className="max-w-sm mx-auto mt-24 px-6 text-center text-ink-dim">This link doesn't exist.</div>
  }

  const expired = new Date(drop.expires_at) < new Date()

  return (
    <DropAccessClient
      dropId={drop.id}
      fileName={drop.file_name}
      fileSize={drop.file_size}
      mimeType={drop.mime_type}
      requiresPassword={!!drop.password_hash}
      expired={expired}
    />
  )
}