// src/components/VoteButtons.tsx
'use client'
import { useState } from 'react'

export default function VoteButtons({ apiId }: { apiId: string }) {
  const [status, setStatus] = useState('')

  async function vote(voteType: 'safe' | 'flagged') {
    const res = await fetch('/api/vote', {
      method: 'POST',
      body: JSON.stringify({ apiId, voteType }),
    })
    setStatus(res.ok ? 'Vote recorded' : 'Could not vote')
  }

  return (
    <div className="flex gap-2 items-center">
      <button onClick={() => vote('safe')} className="px-3 py-1 border rounded text-green-700">Safe</button>
      <button onClick={() => vote('flagged')} className="px-3 py-1 border rounded text-red-700">Flag</button>
      {status && <span className="text-xs text-gray-500">{status}</span>}
    </div>
  )
}