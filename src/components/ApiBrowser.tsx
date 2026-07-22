// src/components/ApiBrowser.tsx
'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import VoteButtons from '@/components/VoteButtons'

type Api = {
  id: string
  name: string
  base_url: string
  description: string | null
  scan_result: string
  pricing_type: 'free' | 'paid'
  pricing_note: string | null
  boosted_until?: string | null
  tags?: string[]
}

export default function ApiBrowser({ apis }: { apis: Api[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return apis
    const q = query.toLowerCase().replace(/^#/, '')
    return apis.filter(api =>
      api.name.toLowerCase().includes(q) ||
      api.description?.toLowerCase().includes(q) ||
      api.tags?.some(t => t.toLowerCase().includes(q))
    )
  }, [query, apis])

  const isBoosted = (a: Api) => a.boosted_until && new Date(a.boosted_until) > new Date()
  const paid = filtered.filter(a => a.pricing_type === 'paid')
    .sort((a, b) => (isBoosted(b) ? 1 : 0) - (isBoosted(a) ? 1 : 0))
  const free = filtered.filter(a => a.pricing_type === 'free')
    .sort((a, b) => (isBoosted(b) ? 1 : 0) - (isBoosted(a) ? 1 : 0))

  return (
    <div className="space-y-14">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search APIs or #tags..."
        className="w-full bg-surface border border-line rounded-lg px-4 py-3 text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink-faint transition"
      />

      {paid.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-xl mb-4">Paid APIs</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {paid.map(api => <ApiCard key={api.id} api={api} boosted={!!isBoosted(api)} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display font-semibold text-xl mb-4">Free APIs</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {free.map(api => <ApiCard key={api.id} api={api} boosted={!!isBoosted(api)} />)}
        </div>
        {filtered.length === 0 && (
          <p className="text-sm text-ink-faint">Nothing matches "{query}".</p>
        )}
      </section>
    </div>
  )
}

function statusStyle(scanResult: string) {
  if (scanResult === 'malicious' || scanResult === 'suspicious')
    return 'bg-flag-dim text-flag'
  if (scanResult === 'clean') return 'bg-safe-dim text-safe'
  return 'bg-surface-2 text-ink-faint'
}

function ApiCard({ api, boosted }: { api: Api; boosted: boolean }) {
  return (
    <div className={`bg-surface border rounded-lg p-5 transition hover:border-ink-faint ${boosted ? 'border-tag' : 'border-line'}`}>
      <div className="flex justify-between items-start mb-2">
        <Link href={`/api/${api.id}`} className="font-mono text-sm hover:text-tag transition">
          {api.name}
        </Link>
        <div className="flex gap-2">
          {boosted && (
            <span className="text-[10px] font-mono uppercase bg-tag text-[#1a2015] px-2 py-0.5 rounded-full">
              Boosted
            </span>
          )}
          {api.pricing_type === 'paid' && (
            <span className="text-[10px] font-mono uppercase bg-tag/15 text-tag px-2 py-0.5 rounded-full">
              {api.pricing_note || 'Paid'}
            </span>
          )}
        </div>
      </div>
      <div className="text-xs font-mono text-ink-faint mb-3">{api.base_url}</div>
      <p className="text-sm text-ink-dim mb-4 leading-relaxed">{api.description}</p>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${statusStyle(api.scan_result)}`}>
          {api.scan_result}
        </span>
        <VoteButtons apiId={api.id} />
      </div>
    </div>
  )
}