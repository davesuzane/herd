// src/app/page.tsx
import { createClient } from '@/utils/supabase/server'
import VoteButtons from '@/components/VoteButtons'

export default async function Home() {
  const supabase = await createClient()
  const { data: apis } = await supabase
    .from('apis')
    .select('id, name, base_url, description, scan_result')
    .order('created_at', { ascending: false })

  return (
    <main className="max-w-3xl mx-auto mt-16 space-y-6">
      <h1 className="text-2xl font-semibold">The herd</h1>
      {apis?.map(api => (
        <div key={api.id} className="border rounded p-4">
          <div className="font-mono">{api.name}</div>
          <div className="text-sm text-gray-500">{api.base_url}</div>
          <p className="text-sm mt-2">{api.description}</p>
          <div className="text-xs mt-1 uppercase text-gray-400">{api.scan_result}</div>
          <div className="mt-3"><VoteButtons apiId={api.id} /></div>
        </div>
      ))}
    </main>
  )
}