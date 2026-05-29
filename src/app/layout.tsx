import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Card Ops Dashboard',
  description: 'Inventory, content, and profit tracking for trading card sellers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}