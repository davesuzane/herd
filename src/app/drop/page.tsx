// src/app/drop/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import * as tus from 'tus-js-client'

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
  const [progress, setProgress] = useState(0)
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
    setProgress(0)

    const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'bin'
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`

    const { data: { session } } = await supabase.auth.getSession()

    try {
      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            authorization: `Bearer ${session?.access_token}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: 'drops',
            objectName: path,
            contentType: file.type || 'application/octet-stream',
          },
          chunkSize: 6 * 1024 * 1024,
          onError: (err) => reject(err),
          onProgress: (bytesUploaded, bytesTotal) => {
            setProgress(Math.round((bytesUploaded / bytesTotal) * 100))
          },
          onSuccess: () => resolve(),
        })

        upload.findPreviousUploads().then((previousUploads) => {
          if (previousUploads.length) upload.resumeFromPreviousUpload(previousUploads[0])
          upload.start()
        })
      })
    } catch (err: any) {
      setError(`Upload failed: ${err.message || 'try again'}`)
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

  const shareLink = result ? `${window.location.origin}/d/${result.id}` : ''

  async function shareFile() {
    if (!result) return
    const shareText = result.code
      ? `Here's a file for you — code: ${result.code}\n${shareLink}`
      : `Here's a file for you (password-protected)\n${shareLink}`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'A file from Herd', text: shareText, url: shareLink })
      } catch {
        // person cancelled the share sheet — not an error
      }
    } else {
      await navigator.clipboard.writeText(shareText)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 1500)
    }
  }

  async function copyLink() {
    if (!result) return
    await navigator.clipboard.writeText(shareLink)
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
      <div className="max-w-sm mx-auto mt-16 px-5 text-center">
        <div className="bg-surface border border-tag rounded-xl p-6">
          <h1 className="font-display font-bold text-2xl mb-5">Ready to share</h1>

          <button onClick={shareFile}
            className="w-full bg-tag text-[#1a2015] font-semibold text-base py-3.5 rounded-lg hover:brightness-110 transition mb-4">
            {typeof window !== 'undefined' && (navigator as any).share ? '📤 Share' : '📋 Copy share text'}
          </button>

          <div className="bg-bg-alt border border-line rounded-lg px-4 py-3 mb-3 flex items-center justify-between gap-2">
            <span className="text-sm font-mono text-ink-dim truncate">{shareLink}</span>
            <button onClick={copyLink} className="text-sm text-tag flex-shrink-0 py-1 px-2">{copiedLink ? '✓' : 'Copy'}</button>
          </div>

          {result.code ? (
            <div className="bg-bg-alt border border-line rounded-lg px-4 py-4 mb-4">
              <p className="text-xs text-ink-faint uppercase mb-2">Access code</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-3xl tracking-widest">{result.code}</span>
                <button onClick={copyCode} className="text-sm text-tag py-1 px-2">{copiedCode ? '✓' : 'Copy'}</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-faint mb-4">Protected with the password you set.</p>
          )}

          <button onClick={() => { setResult(null); setFile(null); setCustomPassword(''); setProgress(0) }}
            className="w-full text-sm font-mono border border-line text-ink-dim py-3 rounded-lg hover:border-ink-faint transition">
            Drop another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto mt-12 px-5 mb-24">
      <h1 className="font-display font-bold text-2xl mb-1">Drop a file</h1>
      <p className="text-sm text-ink-faint mb-6">Private by default. Only whoever has the link and the code can get it.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-ink-dim file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-surface-2 file:text-ink-dim file:text-sm w-full" />

        {uploading && (
          <div>
            <div className="h-2 bg-bg-alt rounded-full overflow-hidden mb-1">
              <div className="h-full bg-tag transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-ink-faint text-center">{progress}%</p>
          </div>
        )}

        <div>
          <label className="text-xs uppercase font-mono text-ink-faint block mb-2">Downloadable for</label>
          <div className="flex gap-2 flex-wrap">
            {DURATIONS.map(d => (
              <button key={d.hours} type="button" onClick={() => setHours(d.hours)}
                className={`text-sm font-mono px-4 py-2 rounded-full border transition ${
                  hours === d.hours ? 'border-tag text-tag bg-tag/10' : 'border-line text-ink-dim hover:border-ink-faint'
                }`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-base mb-2">
            <input type="checkbox" checked={useCustomPassword} onChange={e => setUseCustomPassword(e.target.checked)} className="w-4 h-4" />
            Set my own password
          </label>
          {useCustomPassword ? (
            <input value={customPassword} onChange={e => setCustomPassword(e.target.value)} type="password" placeholder="Password"
              className="w-full bg-surface border border-line rounded-lg px-4 py-3 text-base focus:outline-none focus:border-tag transition" />
          ) : (
            <p className="text-sm text-ink-faint">Otherwise you'll get a random 4-digit code to share instead.</p>
          )}
        </div>

        {error && <p className="text-flag text-sm">{error}</p>}

        <button type="submit" disabled={uploading}
          className="w-full bg-tag text-[#1a2015] font-semibold text-base py-3.5 rounded-lg hover:brightness-110 transition disabled:opacity-60">
          {uploading ? 'Uploading…' : 'Drop it'}
        </button>
      </form>
    </div>
  )
}