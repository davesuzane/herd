// src/components/DropAccessClient.tsx
'use client'
import { useState } from 'react'

export default function DropAccessClient({
  dropId, fileName, fileSize, mimeType, requiresPassword, expired,
}: { dropId: string; fileName: string; fileSize: number; mimeType: string; requiresPassword: boolean; expired: boolean }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setChecking(true)

    const res = await fetch(`/api/drops/${dropId}/access`, {
      method: 'POST',
      body: JSON.stringify({ code: input }),
    })
    const data = await res.json()

    setChecking(false)
    if (!res.ok) { setError(data.error || 'Incorrect.'); return }
    setDownloadUrl(data.url)
  }

  if (expired) {
    return <div className="max-w-sm mx-auto mt-24 px-5 text-center text-ink-dim text-base">This link has expired.</div>
  }

  const sizeLabel = fileSize > 1024 * 1024 * 1024
    ? `${(fileSize / (1024 * 1024 * 1024)).toFixed(2)} GB`
    : fileSize > 1024 * 1024
      ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(fileSize / 1024)} KB`

  return (
    <div className="max-w-sm mx-auto mt-16 px-5">
      <div className="bg-surface border border-line rounded-xl p-6 text-center">
        <h1 className="font-display font-bold text-xl mb-1 break-words">{fileName}</h1>
        <p className="text-sm text-ink-faint mb-6">{sizeLabel}</p>

        {!downloadUrl ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder={requiresPassword ? 'Password' : '4-digit code'}
              type={requiresPassword ? 'password' : 'text'}
              inputMode={requiresPassword ? 'text' : 'numeric'}
              className="w-full bg-bg-alt border border-line rounded-lg px-4 py-3.5 text-lg text-center tracking-widest focus:outline-none focus:border-tag transition" />
            {error && <p className="text-flag text-sm">{error}</p>}
            <button type="submit" disabled={checking}
              className="w-full bg-tag text-[#1a2015] font-semibold text-base py-3.5 rounded-lg hover:brightness-110 transition disabled:opacity-60">
              {checking ? 'Checking…' : 'Unlock'}
            </button>
          </form>
        ) : (
          <>
            {mimeType.startsWith('video/') && (
              <video src={downloadUrl} controls className="w-full rounded-lg mb-4 max-h-80" />
            )}
            <a href={downloadUrl} download={fileName}
              className="block w-full bg-tag text-[#1a2015] font-semibold text-base py-3.5 rounded-lg hover:brightness-110 transition">
              Download
            </a>
            <p className="text-xs text-ink-faint mt-3">This link expires in a couple minutes — re-enter the code if it stops working.</p>
          </>
        )}
      </div>
    </div>
  )
}