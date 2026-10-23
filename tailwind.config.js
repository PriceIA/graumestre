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
        'ativo-hover': 'var(--ativo-hover)',
        etiqueta: 'var(--etiqueta)',
        'sobre-etiqueta': 'var(--sobre-etiqueta)',
        'sobre-etiqueta-suave': 'var(--sobre-etiqueta-suave)',
        'sobre-ativo': 'var(--sobre-ativo)',
        alerta: 'var(--alerta)',
        'sobre-alerta': 'var(--sobre-alerta)',
        'alerta-texto': 'var(--alerta-texto)',
        erro: 'var(--erro)',
        'sobre-erro': 'var(--sobre-erro)',
        'erro-texto': 'var(--erro-texto)',
        sucesso: 'var(--sucesso)',
        'sucesso-texto': 'var(--sucesso-texto)',
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
