import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: groups } = await supabase.from('groups').select('id')
  if (!groups?.length) return NextResponse.json({ ok: true, matched: 0 })

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  let totalPairs = 0

  for (const group of groups) {
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', group.id)

    if (!members || members.length < 2) continue

    // Skip users already matched today in this group
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { data: todayMatches } = await supabase
      .from('matches')
      .select('user1_id, user2_id')
      .eq('group_id', group.id)
      .gte('matched_at', today.toISOString())

    const alreadyMatched = new Set<string>()
    for (const m of todayMatches ?? []) {
      alreadyMatched.add(m.user1_id)
      alreadyMatched.add(m.user2_id)
    }

    const eligible = members
      .map(m => m.user_id)
      .filter(id => !alreadyMatched.has(id))

    if (eligible.length < 2) continue

    // Fisher-Yates shuffle
    for (let i = eligible.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[eligible[i], eligible[j]] = [eligible[j], eligible[i]]
    }

    const pairs: { group_id: string; user1_id: string; user2_id: string; expires_at: string }[] = []
    for (let i = 0; i + 1 < eligible.length; i += 2) {
      pairs.push({
        group_id: group.id,
        user1_id: eligible[i],
        user2_id: eligible[i + 1],
        expires_at: expiresAt,
      })
    }

    if (pairs.length > 0) {
      await supabase.from('matches').insert(pairs)
      totalPairs += pairs.length
    }
  }

  return NextResponse.json({ ok: true, matched: totalPairs, timestamp: new Date().toISOString() })
}
