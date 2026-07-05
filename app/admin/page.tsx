import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Group } from '@/lib/types'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .eq('admin_id', user.id)
    .order('created_at', { ascending: false })

  const counts: Record<string, { members: number; todayMatches: number }> = {}
  for (const g of (groups as Group[]) ?? []) {
    const { count: memberCount } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', g.id)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: matchCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', g.id)
      .gte('matched_at', today.toISOString())

    counts[g.id] = { members: memberCount ?? 0, todayMatches: matchCount ?? 0 }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-5 pt-14 pb-5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600">← ダッシュボード</Link>
            <h1 className="text-xl font-bold text-gray-900 mt-1">管理者</h1>
          </div>
          <Link href="/admin/groups/new"
            className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white text-sm rounded-2xl px-4 py-2 font-medium hover:opacity-90 transition-opacity shadow-sm shadow-violet-200">
            + グループ作成
          </Link>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 pt-5 space-y-3">
        {((groups as Group[]) ?? []).length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-8 text-center space-y-3">
            <p className="text-gray-400 text-sm">グループがありません</p>
            <Link href="/admin/groups/new"
              className="inline-block text-violet-600 text-sm font-medium hover:underline">
              最初のグループを作る
            </Link>
          </div>
        ) : (
          (groups as Group[]).map(g => (
            <Link key={g.id} href={`/admin/groups/${g.id}`}
              className="block bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow">
              <p className="font-semibold text-gray-900">{g.name}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span>{counts[g.id]?.members ?? 0} 名</span>
                <span>今日のマッチング: {counts[g.id]?.todayMatches ?? 0} 組</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  )
}
