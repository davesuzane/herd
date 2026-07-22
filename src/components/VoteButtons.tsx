// src/components/VoteButtons.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function VoteButtons({ apiId }: { apiId: string }) {
  const [status, setStatus] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function vote(voteType: 'safe' | 'flagged') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push(`/login?redirect=/api/${apiId}`); return }

    const res = await fetch('/api/vote', { method: 'POST', body: JSON.stringify({ apiId, voteType }) })
    setStatus(res.ok ? 'Vote recorded' : 'Could not vote')
  }

  return (
    <div className="flex gap-2 items-center">
      <button onClick={() => vote('safe')}
        className="text-xs font-mono px-3 py-1.5 rounded-full border border-safe-dim text-safe hover:bg-safe-dim transition">
        Safe
      </button>
      <button onClick={() => vote('flagged')}
        className="text-xs font-mono px-3 py-1.5 rounded-full border border-flag-dim text-flag hover:bg-flag-dim transition">
        Flag
      </button>
      {status && <span className="text-xs text-ink-faint">{status}</span>}
    </div>
  )
}