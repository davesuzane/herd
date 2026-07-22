// src/app/layout.tsx
import type { Metadata } from 'next'
import { Zilla_Slab, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const zilla = Zilla_Slab({
  subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-zilla',
})
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-sans',
})
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-mono',
})

export const metadata: Metadata = {
  title: 'Herd — community-verified API safety',
  description: 'Every API, vetted by everyone who\'s used it.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${zilla.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body className="font-body min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  )
}