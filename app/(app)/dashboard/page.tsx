import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Countdown } from '@/components/countdown'
import { BottomNav } from '@/components/bottom-nav'
import type { Match, Profile, Group } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/profile/setup')

  const { data: myMatches } = await supabase
    .from('matches')
    .select('*')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .gt('expires_at', new Date().toISOString())
    .order('matched_at', { ascending: false })

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

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = (memberships ?? []).map(m => m.group_id)
  let groups: Group[] = []
  if (groupIds.length > 0) {
    const { data } = await supabase.from('groups').select('*').in('id', groupIds)
    groups = (data as Group[]) ?? []
  }

  const isAdmin = groups.some(g => g.admin_id === user.id)

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  const initial = profile.name.charAt(0)

  return (
    <main className="min-h-screen bg-gray-50 pb-24">

      {/* Top header */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 px-5 pt-14 pb-8">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <p className="text-violet-300 text-xs font-medium">おかえりなさい</p>
            <h1 className="text-white text-xl font-bold mt-0.5">{profile.name}</h1>
          </div>
          <form action={signOut}>
            <button type="submit"
              className="text-white/60 text-xs border border-white/20 rounded-full px-3 py-1.5 hover:text-white hover:border-white/40 transition-colors">
              ログアウト
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 -mt-4 space-y-5">

        {/* Today's match */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">今日のマッチング</p>

          {matchesWithPartners.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm p-6 text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" />
                </svg>
              </div>
              <p className="text-gray-600 text-sm font-medium">マッチング待ち...</p>
              <p className="text-gray-400 text-xs">毎朝0時（JST 9:00）に更新されます</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchesWithPartners.map(({ match, partner }) => (
                <div key={match.id}
                  className="bg-white rounded-3xl shadow-sm overflow-hidden">
                  {/* gradient top strip */}
                  <div className="h-1.5 bg-gradient-to-r from-violet-500 to-indigo-500" />
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-base shrink-0">
                        {partner.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{partner.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{partner.grade} · {partner.affiliation}</p>
                      </div>
                      <Countdown expiresAt={match.expires_at} />
                    </div>

                    {partner.hobbies && (
                      <div className="bg-violet-50 rounded-2xl px-3 py-2">
                        <p className="text-xs text-violet-600">趣味: {partner.hobbies}</p>
                      </div>
                    )}

                    <Link href={`/chat/${match.id}`}
                      className="block w-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white text-sm font-semibold text-center rounded-2xl py-3 hover:opacity-90 transition-opacity shadow-md shadow-violet-200">
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
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">参加中のグループ</p>

          {groups.length === 0 ? (
            <p className="text-sm text-gray-400 px-1">まだグループに参加していません</p>
          ) : (
            <div className="space-y-2">
              {groups.map(g => (
                <div key={g.id}
                  className="bg-white rounded-2xl shadow-sm px-4 py-3.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{g.name}</span>
                  {g.admin_id === user.id && (
                    <span className="text-xs text-violet-600 bg-violet-50 rounded-full px-2.5 py-1 font-medium">管理者</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-400 px-1">招待リンクでグループに参加できます</p>
            <Link href="/admin/groups/new"
              className="block text-center text-sm text-violet-600 border border-violet-200 bg-white rounded-2xl py-3 font-medium hover:bg-violet-50 transition-colors">
              + 新しいグループを作る
            </Link>
          </div>
        </section>

      </div>

      <BottomNav isAdmin={isAdmin} />
    </main>
  )
}
