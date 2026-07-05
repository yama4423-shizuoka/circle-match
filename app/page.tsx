import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex flex-col">
      <div className="max-w-sm mx-auto w-full px-6 flex flex-col min-h-screen py-16">

        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-2">
            <span className="text-violet-300 text-sm font-medium tracking-widest uppercase">Daily Match</span>
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight">
            今日は<br />誰と話す？
          </h1>
          <p className="mt-4 text-violet-200 text-base leading-relaxed">
            グループ内でランダムにマッチング。<br />24時間限定チャットで話してみよう。
          </p>

          <div className="mt-10 space-y-3 text-sm text-white/70">
            {[
              '毎朝グループ内でランダムにペアが決まる',
              'マッチした相手のプロフィールが見られる',
              'チャットは24時間で終了、また明日',
            ].map(f => (
              <div key={f} className="flex items-start gap-2">
                <span className="text-violet-300 mt-0.5">→</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 pb-8">
          <Link href="/signup"
            className="block w-full bg-white text-violet-700 rounded-2xl py-4 text-center font-bold text-base hover:bg-violet-50 transition-colors shadow-lg">
            はじめる
          </Link>
          <Link href="/login"
            className="block w-full text-white/80 text-center py-3 font-medium hover:text-white transition-colors text-sm">
            すでにアカウントがある
          </Link>
        </div>

      </div>
    </main>
  )
}
