// src/app/api/scan/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  const submitRes = await fetch('https://www.virustotal.com/api/v3/urls', {
    method: 'POST',
    headers: {
      'x-apikey': process.env.VIRUSTOTAL_API_KEY!,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `url=${encodeURIComponent(url)}`,
  })

  if (!submitRes.ok) return NextResponse.json({ result: 'pending' })

  const submitData = await submitRes.json()
  const analysisId = submitData.data.id

  // VirusTotal analysis is async — poll once after a short delay
  await new Promise(r => setTimeout(r, 3000))

  const analysisRes = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
    headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY! },
  })
  const analysisData = await analysisRes.json()
  const stats = analysisData.data?.attributes?.stats

  let result = 'pending'
  if (stats) {
    if (stats.malicious > 0) result = 'malicious'
    else if (stats.suspicious > 0) result = 'suspicious'
    else result = 'clean'
  }

  return NextResponse.json({ result })
}