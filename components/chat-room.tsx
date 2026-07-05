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
    <div className="flex flex-col h-dvh max-w-md mx-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white flex items-center gap-3 px-4 py-3 border-b border-gray-100 shadow-sm">
        <button onClick={() => router.push('/dashboard')}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {partner.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{partner.name}</p>
          <p className="text-xs text-gray-400 truncate">{partner.grade} · {partner.affiliation}</p>
        </div>
        <Countdown expiresAt={expiresAt} />
      </div>

      {/* Partner profile card (first open) */}
      {messages.length === 0 && (
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm p-4 text-sm border-l-4 border-violet-400">
          <p className="font-semibold text-gray-900">{partner.name}</p>
          <p className="text-gray-500 text-xs mt-0.5">{partner.grade} · {partner.affiliation}</p>
          {partner.hobbies && (
            <p className="text-violet-600 text-xs mt-1">趣味: {partner.hobbies}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">声をかけてみましょう</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.map(msg => {
          const isMine = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                ${isMine
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-br-sm shadow-sm shadow-violet-200'
                  : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'}`}>
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isExpired ? (
        <div className="bg-white px-4 py-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400">このチャットは終了しました</p>
          <button onClick={() => router.push('/dashboard')}
            className="mt-2 text-sm text-violet-600 font-medium hover:underline">ダッシュボードへ</button>
        </div>
      ) : (
        <div className="bg-white px-4 py-3 border-t border-gray-100 flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="メッセージを入力..."
            rows={1}
            className="flex-1 bg-gray-50 border-0 rounded-2xl px-4 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-violet-400 max-h-28"
          />
          <button onClick={send} disabled={!input.trim() || sending}
            className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0 shadow-sm shadow-violet-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
