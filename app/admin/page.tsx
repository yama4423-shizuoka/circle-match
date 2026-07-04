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

  // Member counts
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
    <main className="max-w-md mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600">← ダッシュボード</Link>
          <h1 className="text-xl font-bold mt-1">管理者</h1>
        </div>
        <Link href="/admin/groups/new"
          className="bg-indigo-600 text-white text-sm rounded-xl px-4 py-2 hover:bg-indigo-700 transition-colors">
          + グループ作成
        </Link>
      </div>

      {(groups as Group[] ?? []).length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>グループがありません</p>
          <Link href="/admin/groups/new" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">
            最初のグループを作る
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(groups as Group[]).map(g => (
            <Link key={g.id} href={`/admin/groups/${g.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-4 hover:border-indigo-200 transition-colors">
              <p className="font-semibold">{g.name}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span>{counts[g.id]?.members ?? 0} 名</span>
                <span>今日のマッチング: {counts[g.id]?.todayMatches ?? 0} 組</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
