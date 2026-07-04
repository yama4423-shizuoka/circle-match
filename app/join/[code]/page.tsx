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
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500">招待リンクが無効です</p>
        </div>
      </main>
    )
  }

  if (!user) redirect(`/login?next=/join/${code}`)

  // Already a member?
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
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6 text-center">
        <div>
          <p className="text-xs text-gray-400 mb-1">グループに招待されました</p>
          <h1 className="text-2xl font-bold">{group.name}</h1>
        </div>
        <form action={joinGroup}>
          <button type="submit"
            className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 transition-colors">
            このグループに参加する
          </button>
        </form>
      </div>
    </main>
  )
}
