// src/components/AuthGateButton.tsx
'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AuthGateButton({
  href, children, className, onAuthed,
}: {
  href?: string
  children: React.ReactNode
  className?: string
  onAuthed?: () => void // for actions that aren't just navigation, e.g. voting
}) {
  const router = useRouter()
  const supabase = createClient()

  async function handleClick() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/login${href ? `?redirect=${encodeURIComponent(href)}` : ''}`)
      return
    }
    if (href) router.push(href)
    onAuthed?.()
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
}