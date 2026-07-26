// src/components/Pagination.tsx
'use client'

export default function Pagination({
  page, totalPages, onChange,
}: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}
        className="text-xs font-mono px-3 py-1.5 rounded-full border border-line text-ink-dim disabled:opacity-40 hover:border-ink-faint transition">
        Prev
      </button>
      <span className="text-xs font-mono text-ink-faint">{page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}
        className="text-xs font-mono px-3 py-1.5 rounded-full border border-line text-ink-dim disabled:opacity-40 hover:border-ink-faint transition">
        Next
      </button>
    </div>
  )
}