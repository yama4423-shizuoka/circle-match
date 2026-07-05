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
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">プロフィール設定</h1>
          <p className="text-gray-500 text-sm mt-1">情報を確認して完了してください</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="名前" name="name" defaultValue={defaults.name} placeholder="山田 花子" required />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">学年</label>
              <select name="grade" required key={defaults.grade} defaultValue={defaults.grade}
                className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-400 appearance-none">
                <option value="">選択してください</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <Field label="所属" name="affiliation" defaultValue={defaults.affiliation} placeholder="3年2組 / テニス部" required />
            <Field label="趣味（任意）" name="hobbies" defaultValue={defaults.hobbies ?? ''} placeholder="読書、映画、料理" />

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-xl py-3.5 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md shadow-violet-200 mt-2">
              {loading ? '保存中...' : 'はじめる'}
            </button>
          </form>
        </div>

      </div>
    </main>
  )
}

function Field({ label, name, type = 'text', placeholder, defaultValue, required }: {
  label: string; name: string; type?: string; placeholder?: string; defaultValue?: string; required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <input name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} required={required}
        className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-400" />
    </div>
  )
}
