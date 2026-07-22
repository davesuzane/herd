// src/components/Footer.tsx
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-line mt-24">
      <div className="max-w-5xl mx-auto px-6 py-10 flex items-center justify-between">
        <span className="font-display font-bold">Herd</span>
        <div className="flex gap-6 text-sm text-ink-faint">
          <Link href="/#browse" className="hover:text-ink-dim transition-colors">Browse</Link>
          <Link href="/submit" className="hover:text-ink-dim transition-colors">Submit</Link>
          <Link href="/login" className="hover:text-ink-dim transition-colors">Sign in</Link>
        </div>
      </div>
    </footer>
  )
}