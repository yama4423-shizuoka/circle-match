'use client'
import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button onClick={copy}
      className="text-xs text-indigo-600 border border-indigo-300 rounded-lg px-3 py-1.5 hover:bg-indigo-100 transition-colors">
      {copied ? 'コピーしました' : 'リンクをコピー'}
    </button>
  )
}
