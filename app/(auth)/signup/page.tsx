'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GRADES } from '@/lib/types'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const email = fd.get('email') as string
    const password = fd.get('password') as string
    const name = fd.get('name') as string
    const grade = fd.get('grade') as string
    const affiliation = fd.get('affiliation') as string
    const hobbies = fd.get('hobbies') as string

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback?next=/profile/setup` },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? '登録に失敗しました')
      setLoading(false)
      return
    }

    localStorage.setItem('pending_profile', JSON.stringify({ name, grade, affiliation, hobbies: hobbies || null }))

    if (data.session) {
      await supabase.from('profiles').insert({ id: data.user.id, name, grade, affiliation, hobbies: hobbies || null })
      router.push('/dashboard')
      router.refresh()
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl text-violet-600">✉</span>
          </div>
          <h2 className="text-xl font-bold">確認メールを送りました</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            メールのリンクをクリックして登録を完了してください。迷惑メールフォルダも確認してみてください。
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">DailyMatch</h1>
          <p className="text-gray-500 text-sm mt-1">新規登録</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="名前" name="name" placeholder="山田 花子" required />
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">学年</label>
              <select name="grade" required
                className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-400 appearance-none">
                <option value="">選択してください</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <Field label="所属" name="affiliation" placeholder="3年2組 / テニス部" required />
            <Field label="趣味（任意）" name="hobbies" placeholder="読書、映画、料理" />
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <Field label="メールアドレス" name="email" type="email" placeholder="you@example.com" required />
              <Field label="パスワード（6文字以上）" name="password" type="password" placeholder="••••••••" required />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-xl py-3.5 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md shadow-violet-200 mt-2">
              {loading ? '登録中...' : '登録する'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          アカウントをお持ちの方は{' '}
          <Link href="/login" className="text-violet-600 font-medium hover:underline">ログイン</Link>
        </p>

      </div>
    </main>
  )
}

function Field({ label, name, type = 'text', placeholder, required }: {
  label: string; name: string; type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <input name={name} type={type} placeholder={placeholder} required={required}
        className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-400" />
    </div>
  )
}
