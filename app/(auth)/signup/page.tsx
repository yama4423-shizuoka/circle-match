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
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback?next=/profile/setup` },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? '登録に失敗しました')
      setLoading(false)
      return
    }

    // Save profile data for use after email confirmation
    localStorage.setItem('pending_profile', JSON.stringify({ name, grade, affiliation, hobbies: hobbies || null }))

    if (data.session) {
      // Email confirmation disabled — create profile immediately
      await supabase.from('profiles').insert({ id: data.user.id, name, grade, affiliation, hobbies: hobbies || null })
      router.push('/dashboard')
      router.refresh()
    } else {
      // Email confirmation required
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-4xl">✉</div>
          <h1 className="text-xl font-bold">確認メールを送りました</h1>
          <p className="text-sm text-gray-500">
            受信したメールのリンクをクリックして登録を完了してください
          </p>
          <p className="text-xs text-gray-400">迷惑メールフォルダも確認してみてください</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold">新規登録</h1>
          <p className="mt-1 text-sm text-gray-500">プロフィールを設定してはじめましょう</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="名前" name="name" placeholder="山田 花子" required />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">学年</label>
            <select name="grade" required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">選択してください</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <Field label="所属（クラス・サークルなど）" name="affiliation" placeholder="3年2組 / テニス部" required />
          <Field label="趣味（任意）" name="hobbies" placeholder="読書、映画、料理" />
          <Field label="メールアドレス" name="email" type="email" placeholder="you@example.com" required />
          <Field label="パスワード（6文字以上）" name="password" type="password" placeholder="••••••••" required />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {loading ? '登録中...' : '登録する'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          アカウントをお持ちの方は{' '}
          <Link href="/login" className="text-indigo-600 hover:underline">ログイン</Link>
        </p>
      </div>
    </main>
  )
}

function Field({ label, name, type = 'text', placeholder, required }: {
  label: string; name: string; type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input name={name} type={type} placeholder={placeholder} required={required}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
    </div>
  )
}
