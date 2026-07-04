import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Countdown } from '@/components/countdown'
import type { Match, Profile, Group } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/profile/setup')

  // Today's active matches
  const { data: myMatches } = await supabase
    .from('matches')
    .select('*')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .gt('expires_at', new Date().toISOString())
    .order('matched_at', { ascending: false })

  // Fetch partner profiles for each match
  const matchesWithPartners: { match: Match; partner: Profile }[] = []
  for (const match of myMatches ?? []) {
    const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id
    const { data: partner } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', partnerId)
      .single<Profile>()
    if (partner) matchesWithPartners.push({ match, partner })
  }

  // Groups
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = (memberships ?? []).map(m => m.group_id)
  let groups: Group[] = []
  if (groupIds.length > 0) {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds)
    groups = (data as Group[]) ?? []
  }

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  return (
    <main className="max-w-md mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">おかえりなさい</p>
          <h1 className="text-xl font-bold">{profile.name}さん</h1>
        </div>
        <div className="flex gap-2">
          {groups.some(g => g.admin_id === user.id) && (
            <Link href="/admin"
              className="text-xs text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50">
              管理
            </Link>
          )}
          <form action={signOut}>
            <button type="submit"
              className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-100">
              ログアウト
            </button>
          </form>
        </div>
      </div>

      {/* Today's matches */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">今日のマッチング</h2>
        {matchesWithPartners.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-gray-400 text-sm">今日のマッチング待ち...</p>
            <p className="text-xs text-gray-300 mt-1">毎日0時（JST 9:00）に更新されます</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matchesWithPartners.map(({ match, partner }) => (
              <div key={match.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div>
                  <p className="font-semibold">{partner.name}</p>
                  <p className="text-sm text-gray-500">{partner.grade} · {partner.affiliation}</p>
                  {partner.hobbies && (
                    <p className="text-xs text-gray-400 mt-1">趣味: {partner.hobbies}</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Countdown expiresAt={match.expires_at} />
                  <Link href={`/chat/${match.id}`}
                    className="bg-indigo-600 text-white text-sm rounded-xl px-4 py-2 hover:bg-indigo-700 transition-colors">
                    チャットを開く
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Groups */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">参加中のグループ</h2>
        {groups.length === 0 ? (
          <p className="text-sm text-gray-400">まだグループに参加していません</p>
        ) : (
          <div className="space-y-2">
            {groups.map(g => (
              <div key={g.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium">{g.name}</span>
                {g.admin_id === user.id && (
                  <span className="text-xs text-indigo-500 bg-indigo-50 rounded-full px-2 py-0.5">管理者</span>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 space-y-2">
          <p className="text-xs text-gray-400">招待リンクでグループに参加できます</p>
          <Link href="/admin/groups/new"
            className="block text-center text-sm text-indigo-600 border border-indigo-200 rounded-xl py-2.5 hover:bg-indigo-50">
            新しいグループを作る
          </Link>
        </div>
      </section>
    </main>
  )
}
