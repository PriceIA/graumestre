'use client';

import { useEffect, useRef, useState } from 'react';

interface SplashScreenProps {
  /** Chamado quando o vídeo termina (ou é pulado) */
  onComplete?: () => void;
}

const SESSION_KEY = 'gm_splash_seen';

/**
 * Teto absoluto: o splash nunca fica mais que isso na tela, aconteça o que
 * acontecer. O vídeo tem ~5s; o resto é margem.
 */
const TETO_MS = 8000;

/**
 * Se o vídeo não saiu do zero até aqui, desistimos. Um `<video>` travado no
 * `readyState 0` não dispara `error` nem `loadedmetadata`, então checar por
 * evento não basta — tem que ser no tempo.
 */
const CHECAGEM_ARRANQUE_MS = 3000;

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const doneRef = useRef(false);

  /** idempotente: `ended`, clique, erro e timeouts podem chegar juntos */
  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;

    timersRef.current.forEach(clearTimeout);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, '1');
    }
    setVisible(false);
    onComplete?.();
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // já viu nesta sessão? pula direto
    if (sessionStorage.getItem(SESSION_KEY)) {
      finish();
      return;
    }

    // autoplay com som mudo é permitido, mas alguns navegadores ainda
    // recusam; se recusar, não deixa o usuário preso no preto
    videoRef.current?.play().catch(() => finish());

    timersRef.current.push(
      setTimeout(() => {
        // não arrancou do zero: assume travado e libera o app
        if (!videoRef.current?.currentTime) finish();
      }, CHECAGEM_ARRANQUE_MS),
      setTimeout(finish, TETO_MS)
    );

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div
      onClick={finish}
      role="button"
      aria-label="Pular abertura"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
        onStalled={finish}
        style={{
          width: '100%',
          height: '100%',
          // `contain` para nunca cortar a logo em tela estreita
          objectFit: 'contain',
        }}
      >
        {/* só mp4: H.264/AAC toca em todo navegador, e o webm VP9 travava
            em readyState 0 sem disparar error, prendendo o splash */}
        <source src="/abertura-graumestre.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
