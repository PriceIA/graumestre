import type { Metadata, Viewport } from 'next'
import { Anton, Open_Sans } from 'next/font/google'
import SplashGate from '@/components/SplashGate'
import RegistroServiceWorker from '@/components/RegistroServiceWorker'
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
  icons: {
    icon: [{ url: '/icons/favicon.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  // iOS ignora o manifest para o modo standalone; quem manda lá são estas
  // meta tags. Sem elas, o atalho na tela inicial abre dentro do Safari.
  appleWebApp: {
    capable: true,
    title: 'GrauMestre',
    statusBarStyle: 'black-translucent',
  },
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
        <RegistroServiceWorker />
        <SplashGate>{children}</SplashGate>
      </body>
    </html>
  )
}
