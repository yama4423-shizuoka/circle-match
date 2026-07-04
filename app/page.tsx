import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DailyMatch</h1>
          <p className="mt-2 text-gray-500 text-sm">毎日1人とマッチング。24時間限定チャット。</p>
        </div>
        <div className="space-y-3">
          <Link href="/signup"
            className="block w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 transition-colors">
            新規登録
          </Link>
          <Link href="/login"
            className="block w-full border border-gray-200 text-gray-700 rounded-xl py-3 text-sm font-medium hover:bg-gray-100 transition-colors">
            ログイン
          </Link>
        </div>
      </div>
    </main>
  )
}
