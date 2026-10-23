import type { Metadata, Viewport } from 'next'
import { Archivo, Big_Shoulders_Stencil_Display } from 'next/font/google'
import SplashGate from '@/components/SplashGate'
import RegistroServiceWorker from '@/components/RegistroServiceWorker'
import { SCRIPT_TEMA } from '@/lib/tema'
import './globals.css'

// Archivo variável com o eixo de largura (wdth): é o que deixa caber nome longo
// de aluno sem encolher a letra. Estêncil só para título e número (DESIGN.md).
const archivo = Archivo({
  subsets: ['latin'],
  weight: 'variable',
  axes: ['wdth'],
  display: 'swap',
  variable: '--font-ui',
})

const estencil = Big_Shoulders_Stencil_Display({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  display: 'swap',
  variable: '--font-display',
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F4F1' },
    { media: '(prefers-color-scheme: dark)', color: '#131312' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: o script abaixo põe data-tema no <html> antes
    // do React hidratar, e o servidor não sabe esse valor.
    <html lang="pt-BR" className={`${archivo.variable} ${estencil.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body>
        <RegistroServiceWorker />
        <SplashGate>{children}</SplashGate>
      </body>
    </html>
  )
}
