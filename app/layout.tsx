import type { Metadata, Viewport } from 'next'
import { Anton, Open_Sans } from 'next/font/google'
import SplashGate from '@/components/SplashGate'
import './globals.css'

const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
})

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'GrauMestre',
  description: 'Gestão de alunos e aulas de jiu-jítsu',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${openSans.variable}`}>
      <body className="font-body">
        <SplashGate>{children}</SplashGate>
      </body>
    </html>
  )
}
