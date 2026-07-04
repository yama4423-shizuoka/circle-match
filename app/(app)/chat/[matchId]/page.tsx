import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ChatRoom } from '@/components/chat-room'
import type { Match, Profile, Message } from '@/lib/types'

export default async function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single<Match>()

  if (!match) notFound()

  // Verify participant
  if (match.user1_id !== user.id && match.user2_id !== user.id) notFound()

  const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id

  const { data: partner } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', partnerId)
    .single<Profile>()

  if (!partner) notFound()

  // Initial messages
  const { data: initialMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })

  return (
    <ChatRoom
      matchId={matchId}
      currentUserId={user.id}
      partner={partner}
      expiresAt={match.expires_at}
      initialMessages={(initialMessages as Message[]) ?? []}
    />
  )
}
