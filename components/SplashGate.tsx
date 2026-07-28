'use client';

import { useState } from 'react';
import SplashScreen from './SplashScreen';

export default function SplashGate({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {/* o app já renderiza por baixo, então quando a splash sai
          o app aparece na hora, sem tela branca de espera */}
      {children}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
    </>
  );
}
