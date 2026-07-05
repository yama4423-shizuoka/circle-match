'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function generateCode(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function NewGroupPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const name = (fd.get('name') as string).trim()
    if (!name) { setError('グループ名を入力してください'); setLoading(false); return }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const inviteCode = generateCode()
    const { data: group, error: insertError } = await supabase
      .from('groups')
      .insert({ name, invite_code: inviteCode, admin_id: user.id })
      .select()
      .single()

    if (insertError || !group) {
      setError('グループの作成に失敗しました')
      setLoading(false)
      return
    }

    await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id })
    router.push(`/admin/groups/${group.id}`)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">

        <div className="mb-6">
          <Link href="/admin" className="text-xs text-gray-400 hover:text-gray-600">← 管理者</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">グループを作成</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">グループ名</label>
              <input name="name" type="text" required placeholder="3年A組 / テニス同好会"
                className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-400" />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-xl py-3.5 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md shadow-violet-200 mt-2">
              {loading ? '作成中...' : 'グループを作成する'}
            </button>
          </form>
        </div>

      </div>
    </main>
  )
}
