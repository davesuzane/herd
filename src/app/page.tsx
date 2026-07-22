// src/app/page.tsx
import { createClient } from '@/utils/supabase/server'
import ApiBrowser from '@/components/ApiBrowser'
import AuthGateButton from '@/components/AuthGateButton'

export default async function Home() {
  const supabase = await createClient()

  const { data: apis } = await supabase
    .from('apis')
    .select('id, name, base_url, description, scan_result, pricing_type, pricing_note, boosted_until, api_tags(tags(name))')
    .order('created_at', { ascending: false })

  const normalized = (apis || []).map(a => ({
    ...a,
    tags: (a as any).api_tags?.map((t: any) => t.tags?.name).filter(Boolean) || [],
  }))

  const total = normalized.length

  return (
    <main>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-safe mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-safe shadow-[0_0_0_4px_var(--color-safe-dim)]" />
          {total} APIs currently in the herd
        </div>
        <h1 className="font-display font-bold text-4xl sm:text-5xl leading-[1.05] mb-5 max-w-2xl">
          Every API, vetted by <span className="text-tag">everyone</span> who's used it.
        </h1>
        <p className="text-ink-dim text-lg max-w-lg mb-8 leading-relaxed">
          Drop in any API. The herd votes on whether it's safe or shady, tags it by what it
          actually does, and keeps the list honest — for free, forever.
        </p>
        <div className="flex gap-3">
          <AuthGateButton
            href="/submit"
            className="bg-tag text-[#1a2015] font-semibold px-6 py-3 rounded hover:brightness-110 transition"
          >
            Submit an API
          </AuthGateButton>
          <a href="#browse"
            className="border border-line px-6 py-3 rounded font-semibold hover:border-ink-faint transition">
            Browse the herd
          </a>
        </div>
      </section>

      {/* Browse */}
      <section id="browse" className="max-w-5xl mx-auto px-6 pb-24 border-t border-line pt-16">
        <ApiBrowser apis={normalized} />
      </section>
    </main>
  )
}