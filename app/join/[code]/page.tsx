import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Group } from '@/lib/types'

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', code)
    .single<Group>()

  if (!group) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-sm w-full">
          <p className="text-gray-500 text-sm">招待リンクが無効です</p>
        </div>
      </main>
    )
  }

  if (!user) redirect(`/login?next=/join/${code}`)

  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) redirect('/dashboard')

  async function joinGroup() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    await supabase.from('group_members').insert({
      group_id: group!.id,
      user_id: user.id,
    })
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center space-y-6">
          <div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
              {group.name.charAt(0)}
            </div>
            <p className="text-xs text-gray-400 mb-1">グループに招待されました</p>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          </div>
          <form action={joinGroup}>
            <button type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-2xl py-3.5 font-semibold hover:opacity-90 transition-opacity shadow-md shadow-violet-200">
              このグループに参加する
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
