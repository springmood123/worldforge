import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'WorldForge-灵感激荡',
  description: '一站式架空世界观构建平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen transition-colors duration-300">
        {children}
      </body>
    </html>
  )
}
