import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { CopyButton } from './copy-button'
import type { Group, Profile, Match } from '@/lib/types'

export default async function GroupAdminPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single<Group>()

  if (!group || group.admin_id !== user.id) notFound()

  // Members with profiles
  const { data: memberRows } = await supabase
    .from('group_members')
    .select('user_id, joined_at')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  const memberIds = (memberRows ?? []).map(m => m.user_id)
  let members: Profile[] = []
  if (memberIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('id', memberIds)
    members = (data as Profile[]) ?? []
  }

  // Recent matches (last 30)
  const { data: matchRows } = await supabase
    .from('matches')
    .select('*')
    .eq('group_id', groupId)
    .order('matched_at', { ascending: false })
    .limit(30)

  const allUserIds = [...new Set((matchRows ?? []).flatMap(m => [m.user1_id, m.user2_id]))]
  const profileMap: Record<string, Profile> = {}
  if (allUserIds.length > 0) {
    const { data } = await supabase.from('profiles').select('*').in('id', allUserIds)
    for (const p of (data as Profile[]) ?? []) profileMap[p.id] = p
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/join/${group.invite_code}`

  return (
    <main className="max-w-md mx-auto px-4 py-8 space-y-8">
      <div>
        <Link href="/admin" className="text-xs text-gray-400 hover:text-gray-600">← 管理者</Link>
        <h1 className="text-xl font-bold mt-1">{group.name}</h1>
      </div>

      {/* Invite link */}
      <section className="bg-indigo-50 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold text-indigo-700">招待リンク</p>
        <p className="text-xs text-indigo-500 break-all font-mono">{inviteUrl}</p>
        <CopyButton text={inviteUrl} />
      </section>

      {/* Members */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">参加者 ({members.length}名)</h2>
        {members.length === 0 ? (
          <p className="text-sm text-gray-400">まだ参加者がいません</p>
        ) : (
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                <p className="text-sm font-medium">{m.name}</p>
                <p className="text-xs text-gray-400">{m.grade} · {m.affiliation}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Match history */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">マッチ履歴</h2>
        {(matchRows ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">まだマッチングがありません</p>
        ) : (
          <div className="space-y-2">
            {(matchRows as Match[]).map(m => {
              const p1 = profileMap[m.user1_id]
              const p2 = profileMap[m.user2_id]
              const d = new Date(m.matched_at)
              const dateStr = `${d.getMonth() + 1}/${d.getDate()}`
              return (
                <div key={m.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
                  <p className="text-sm">
                    {p1?.name ?? '?'} × {p2?.name ?? '?'}
                  </p>
                  <span className="text-xs text-gray-400">{dateStr}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
