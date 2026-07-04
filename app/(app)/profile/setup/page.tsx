'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GRADES } from '@/lib/types'

export default function ProfileSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [defaults, setDefaults] = useState({ name: '', grade: '', affiliation: '', hobbies: '' })

  useEffect(() => {
    const stored = localStorage.getItem('pending_profile')
    if (stored) {
      try { setDefaults(JSON.parse(stored)) } catch {}
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const name = fd.get('name') as string
    const grade = fd.get('grade') as string
    const affiliation = fd.get('affiliation') as string
    const hobbies = fd.get('hobbies') as string

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id, name, grade, affiliation, hobbies: hobbies || null,
    })

    if (error) {
      setError(`保存に失敗しました: ${error.message}`)
      setLoading(false)
      return
    }

    localStorage.removeItem('pending_profile')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold">プロフィール設定</h1>
          <p className="mt-1 text-sm text-gray-500">情報を確認して完了してください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">名前</label>
            <input name="name" required defaultValue={defaults.name} placeholder="山田 花子"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">学年</label>
            <select name="grade" required key={defaults.grade} defaultValue={defaults.grade}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">選択してください</option>
              {GRADES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">所属</label>
            <input name="affiliation" required defaultValue={defaults.affiliation} placeholder="3年2組 / テニス部"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">趣味（任意）</label>
            <input name="hobbies" defaultValue={defaults.hobbies ?? ''} placeholder="読書、映画、料理"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {loading ? '保存中...' : 'はじめる'}
          </button>
        </form>
      </div>
    </main>
  )
}
