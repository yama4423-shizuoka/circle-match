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

  const { data: memberRows } = await supabase
    .from('group_members')
    .select('user_id, joined_at')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  const memberIds = (memberRows ?? []).map(m => m.user_id)
  let members: Profile[] = []
  if (memberIds.length > 0) {
    const { data } = await supabase.from('profiles').select('*').in('id', memberIds)
    members = (data as Profile[]) ?? []
  }

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
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-5 pt-14 pb-5">
        <div className="max-w-md mx-auto">
          <Link href="/admin" className="text-xs text-gray-400 hover:text-gray-600">← 管理者</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{group.name}</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 pt-5 space-y-6">

        {/* Invite link */}
        <section className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-3xl p-5 space-y-3">
          <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">招待リンク</p>
          <p className="text-xs text-gray-600 break-all font-mono bg-white rounded-xl px-3 py-2.5">{inviteUrl}</p>
          <CopyButton text={inviteUrl} />
        </section>

        {/* Members */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">参加者 ({members.length}名)</p>
          {members.length === 0 ? (
            <p className="text-sm text-gray-400 px-1">まだ参加者がいません</p>
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.grade} · {m.affiliation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Match history */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">マッチ履歴</p>
          {(matchRows ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 px-1">まだマッチングがありません</p>
          ) : (
            <div className="space-y-2">
              {(matchRows as Match[]).map(m => {
                const p1 = profileMap[m.user1_id]
                const p2 = profileMap[m.user2_id]
                const d = new Date(m.matched_at)
                const dateStr = `${d.getMonth() + 1}/${d.getDate()}`
                return (
                  <div key={m.id} className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center justify-between">
                    <p className="text-sm text-gray-800">
                      {p1?.name ?? '?'} × {p2?.name ?? '?'}
                    </p>
                    <span className="text-xs text-gray-400 bg-gray-50 rounded-full px-2.5 py-1">{dateStr}</span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
