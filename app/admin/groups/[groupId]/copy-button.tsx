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
      className={`text-xs rounded-xl px-4 py-2 font-medium transition-all ${
        copied
          ? 'bg-green-500 text-white'
          : 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white hover:opacity-90 shadow-sm shadow-violet-200'
      }`}>
      {copied ? '✓ コピーしました' : 'リンクをコピー'}
    </button>
  )
}
