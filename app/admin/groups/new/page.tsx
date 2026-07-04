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

    // Auto-join as member
    await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id })

    router.push(`/admin/groups/${group.id}`)
  }

  return (
    <main className="max-w-md mx-auto px-4 py-8 space-y-6">
      <div>
        <Link href="/admin" className="text-xs text-gray-400 hover:text-gray-600">← 管理者</Link>
        <h1 className="text-xl font-bold mt-1">グループを作成</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">グループ名</label>
          <input name="name" type="text" required placeholder="3年A組 / テニス同好会"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
          {loading ? '作成中...' : 'グループを作成する'}
        </button>
      </form>
    </main>
  )
}
