'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  /** Chamado quando a animação termina (ou é pulada) */
  onComplete?: () => void;
}

type Phase = 'logo' | 'oss' | 'wipe';

const SESSION_KEY = 'gm_splash_seen';

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<Phase>('logo');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // já viu nesta sessão? pula direto
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) {
      setVisible(false);
      onComplete?.();
      return;
    }

    const t1 = setTimeout(() => setPhase('oss'), 2200);
    const t2 = setTimeout(() => setPhase('wipe'), 4400);
    const t3 = setTimeout(() => finish(), 5200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, '1');
    }
    setVisible(false);
    onComplete?.();
  }

  if (!visible) return null;

  return (
    <div
      onClick={finish}
      role="button"
      aria-label="Pular animação de abertura"
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
      {/* faixa vermelha diagonal que varre a tela ao final */}
      <div
        style={{
          position: 'absolute',
          inset: '-25% -10%',
          background: '#af0000',
          transform:
            phase === 'wipe'
              ? 'translateX(0%) skewX(-8deg)'
              : 'translateX(135%) skewX(-8deg)',
          transition: 'transform 0.85s cubic-bezier(.76,0,.24,1)',
          zIndex: 3,
        }}
      />

      {/* fase 1: logo */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: phase === 'logo' ? 1 : 0,
          transform: phase === 'logo' ? 'scale(1)' : 'scale(1.12)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          zIndex: 2,
        }}
      >
        <div
          className="gm-logo-ring"
          style={{
            width: 200,
            height: 200,
            borderRadius: '50%',
            overflow: 'hidden',
            WebkitMaskImage: 'radial-gradient(circle, #000 66%, transparent 71%)',
            maskImage: 'radial-gradient(circle, #000 66%, transparent 71%)',
            filter: 'drop-shadow(0 0 40px rgba(175,0,0,0.45))',
          }}
        >
          <Image
            src="/images/logo-fo.jpeg"
            alt="Flavio Oliveira Jiu-Jitsu"
            width={200}
            height={200}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            priority
          />
        </div>
      </div>

      {/* fase 2: OSS / PROFESSOR */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: phase !== 'logo' ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      >
        <span
          className={phase !== 'logo' ? 'gm-oss-in' : ''}
          style={{
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: '0.06em',
            fontSize: 'clamp(64px, 17vw, 150px)',
            lineHeight: 0.85,
            color: '#ffffff',
            textShadow: '0 0 45px rgba(175,0,0,0.55)',
          }}
        >
          OSS
        </span>
        <span
          className={phase !== 'logo' ? 'gm-prof-in' : ''}
          style={{
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.4em',
            fontSize: 'clamp(13px, 2.8vw, 20px)',
            color: '#af0000',
            marginTop: 14,
          }}
        >
          Professor
        </span>
      </div>

      <style jsx>{`
        .gm-logo-ring {
          animation: gm-pop 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .gm-oss-in {
          display: inline-block;
          animation: gm-rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .gm-prof-in {
          display: inline-block;
          animation: gm-rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both;
        }
        @keyframes gm-pop {
          0% {
            opacity: 0;
            transform: scale(0.35) rotate(-10deg);
          }
          60% {
            opacity: 1;
            transform: scale(1.08) rotate(2deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        @keyframes gm-rise {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.92);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .gm-logo-ring,
          .gm-oss-in,
          .gm-prof-in {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
