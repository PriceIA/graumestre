/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tokens do DESIGN.md (valores em app/globals.css, dois temas).
        fundo: 'var(--fundo)',
        papel: 'var(--papel)',
        tinta: 'var(--tinta)',
        'tinta-media': 'var(--tinta-media)',
        'tinta-suave': 'var(--tinta-suave)',
        linha: 'var(--linha)',
        controle: 'var(--controle)',
        ativo: 'var(--ativo)',
        'sobre-ativo': 'var(--sobre-ativo)',
        alerta: 'var(--alerta)',
        'sobre-alerta': 'var(--sobre-alerta)',
        'alerta-texto': 'var(--alerta-texto)',
        erro: 'var(--erro)',
        'sobre-erro': 'var(--sobre-erro)',
        'erro-texto': 'var(--erro-texto)',
        sucesso: 'var(--sucesso)',
        'sucesso-texto': 'var(--sucesso-texto)',
        // Legado, só até a Task 3 da G3: o Dashboard e components/ui ainda são
        // escuros por dentro (text-white), então estes quatro mantêm os valores
        // de antes em vez de seguir o tema. Apontar para os tokens agora daria
        // branco sobre branco no tema claro.
        bg: '#0a0a0a',
        surface: '#161616',
        'surface-hover': '#1f1f1f',
        accent: '#df2531',
      },
      fontFamily: {
        display: ['var(--display)'],
        body: ['var(--ui)'],
      },
      borderRadius: {
        DEFAULT: 'var(--r)',
      },
      keyframes: {
        'fade-slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'grow-height': {
          '0%': { transform: 'scaleY(0)' },
          '100%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        'fade-slide-up': 'fade-slide-up 0.3s ease-out both',
        'grow-height': 'grow-height 0.5s ease-out both',
      },
    },
  },
  plugins: [],
}
