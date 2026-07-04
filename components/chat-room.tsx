'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Countdown } from './countdown'
import type { Message, Profile } from '@/lib/types'

interface Props {
  matchId: string
  currentUserId: string
  partner: Profile
  expiresAt: string
  initialMessages: Message[]
}

export function ChatRoom({ matchId, currentUserId, partner, expiresAt, initialMessages }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const isExpired = new Date(expiresAt) < new Date()

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchId, supabase])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || sending || isExpired) return
    setSending(true)
    setInput('')

    await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: currentUserId,
      content: text,
    })
    setSending(false)
  }

  return (
    <div className="flex flex-col h-dvh max-w-md mx-auto bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <button onClick={() => router.push('/dashboard')}
          className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{partner.name}</p>
          <p className="text-xs text-gray-400 truncate">{partner.grade} · {partner.affiliation}</p>
        </div>
        <Countdown expiresAt={expiresAt} />
      </div>

      {/* Partner profile card */}
      {messages.length === 0 && (
        <div className="mx-4 mt-4 bg-indigo-50 rounded-xl p-3 text-sm">
          <p className="font-medium text-indigo-900">{partner.name}</p>
          <p className="text-indigo-600 text-xs mt-0.5">{partner.grade} · {partner.affiliation}</p>
          {partner.hobbies && (
            <p className="text-indigo-500 text-xs mt-1">趣味: {partner.hobbies}</p>
          )}
          <p className="text-xs text-indigo-400 mt-2">声をかけてみましょう</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map(msg => {
          const isMine = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                ${isMine
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isExpired ? (
        <div className="px-4 py-4 border-t text-center">
          <p className="text-sm text-gray-400">このチャットは終了しました</p>
          <button onClick={() => router.push('/dashboard')}
            className="mt-2 text-sm text-indigo-600 hover:underline">ダッシュボードへ</button>
        </div>
      ) : (
        <div className="px-4 py-3 border-t flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="メッセージを入力..."
            rows={1}
            className="flex-1 border border-gray-200 rounded-2xl px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-400 max-h-28"
          />
          <button onClick={send} disabled={!input.trim() || sending}
            className="bg-indigo-600 text-white rounded-full w-9 h-9 flex items-center justify-center text-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors shrink-0">
            ↑
          </button>
        </div>
      )}
    </div>
  )
}
