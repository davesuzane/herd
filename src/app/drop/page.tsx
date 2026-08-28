// src/app/drop/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const DURATIONS = [
  { label: '1 hour', hours: 1 },
  { label: '24 hours', hours: 24 },
  { label: '7 days', hours: 24 * 7 },
  { label: '30 days', hours: 24 * 30 },
]

export default function DropPage() {
  const supabase = createClient()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [hours, setHours] = useState(24)
  const [useCustomPassword, setUseCustomPassword] = useState(false)
  const [customPassword, setCustomPassword] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ id: string; code: string | null } | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!file) { setError('Choose a file first.'); return }
    if (useCustomPassword && customPassword.length < 4) { setError('Password needs to be at least 4 characters.'); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login?redirect=/drop'); return }

    setUploading(true)

    const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'bin'
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('drops').upload(path, file)

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`)
      setUploading(false)
      return
    }

    const res = await fetch('/api/drops', {
      method: 'POST',
      body: JSON.stringify({
        storagePath: path,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        hours,
        customPassword: useCustomPassword ? customPassword : null,
      }),
    })
    const data = await res.json()

    setUploading(false)
    if (!res.ok) { setError(data.error || 'Something went wrong.'); return }

    setResult({ id: data.id, code: data.code })
  }

  async function copyLink() {
    if (!result) return
    await navigator.clipboard.writeText(`${window.location.origin}/d/${result.id}`)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 1500)
  }

  async function copyCode() {
    if (!result?.code) return
    await navigator.clipboard.writeText(result.code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 1500)
  }

  if (result) {
    return (
      <div className="max-w-sm mx-auto mt-24 px-6 text-center">
        <div className="bg-surface border border-tag rounded-xl p-8">
          <h1 className="font-display font-bold text-xl mb-4">Ready to share</h1>

          <div className="bg-bg-alt border border-line rounded-lg px-3 py-2.5 mb-2 flex items-center justify-between">
            <span className="text-xs font-mono text-ink-faint truncate">{`${window.location.origin}/d/${result.id}`}</span>
            <button onClick={copyLink} className="text-xs text-tag flex-shrink-0 ml-2">{copiedLink ? '✓' : 'Copy'}</button>
          </div>

          {result.code ? (
            <div className="bg-bg-alt border border-line rounded-lg px-3 py-3 mb-4">
              <p className="text-[10px] text-ink-faint uppercase mb-1">Access code</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl tracking-widest">{result.code}</span>
                <button onClick={copyCode} className="text-xs text-tag">{copiedCode ? '✓' : 'Copy'}</button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-faint mb-4">Protected with the password you set.</p>
          )}

          <button onClick={() => { setResult(null); setFile(null); setCustomPassword('') }}
            className="w-full text-xs font-mono border border-line text-ink-dim py-2 rounded hover:border-ink-faint transition">
            Drop another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto mt-16 px-6 mb-24">
      <h1 className="font-display font-bold text-2xl mb-1">Drop a file</h1>
      <p className="text-xs text-ink-faint mb-6">Private by default. Only whoever has the link and the code can get it.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-ink-dim file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-surface-2 file:text-ink-dim file:text-xs" />

        <div>
          <label className="text-[10px] uppercase font-mono text-ink-faint block mb-2">Downloadable for</label>
          <div className="flex gap-2 flex-wrap">
            {DURATIONS.map(d => (
              <button key={d.hours} type="button" onClick={() => setHours(d.hours)}
                className={`text-xs font-mono px-3 py-1.5 rounded-full border transition ${
                  hours === d.hours ? 'border-tag text-tag bg-tag/10' : 'border-line text-ink-dim hover:border-ink-faint'
                }`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm mb-2">
            <input type="checkbox" checked={useCustomPassword} onChange={e => setUseCustomPassword(e.target.checked)} />
            Set my own password
          </label>
          {useCustomPassword ? (
            <input value={customPassword} onChange={e => setCustomPassword(e.target.value)} type="password" placeholder="Password"
              className="w-full bg-surface border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-tag transition" />
          ) : (
            <p className="text-[11px] text-ink-faint">Otherwise you'll get a random 4-digit code to share instead.</p>
          )}
        </div>

        {error && <p className="text-flag text-sm">{error}</p>}

        <button type="submit" disabled={uploading}
          className="w-full bg-tag text-[#1a2015] font-semibold py-2.5 rounded hover:brightness-110 transition disabled:opacity-60">
          {uploading ? 'Uploading…' : 'Drop it'}
        </button>
      </form>
    </div>
  )
}