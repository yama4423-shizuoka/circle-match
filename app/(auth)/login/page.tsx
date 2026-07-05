'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: fd.get('email') as string,
      password: fd.get('password') as string,
    })
    if (error) { setError('メールアドレスまたはパスワードが違います'); setLoading(false); return }
    router.push(next)
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">DailyMatch</h1>
          <p className="text-gray-500 text-sm mt-1">ログイン</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">メールアドレス</label>
              <input name="email" type="email" required placeholder="you@example.com"
                className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">パスワード</label>
              <input name="password" type="password" required placeholder="••••••••"
                className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-400" />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-xl py-3.5 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md shadow-violet-200 mt-2">
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          アカウントがない方は{' '}
          <Link href="/signup" className="text-violet-600 font-medium hover:underline">新規登録</Link>
        </p>

      </div>
    </main>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
