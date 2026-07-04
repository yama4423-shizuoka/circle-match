'use client'
import { useEffect, useState } from 'react'

export function Countdown({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setLabel('終了'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setLabel(`残り ${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const isExpired = new Date(expiresAt) < new Date()
  return (
    <span className={`text-xs font-mono ${isExpired ? 'text-red-400' : 'text-gray-400'}`}>
      {label}
    </span>
  )
}
