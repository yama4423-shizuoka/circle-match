import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DailyMatch',
  description: '毎日1人とマッチングして、24時間限定チャット',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
