'use client';

import dynamic from 'next/dynamic';
import { ColorBends } from '../ui';

const ColorBendsClient = dynamic(() => Promise.resolve(ColorBends), { ssr: false });

/** Full-page Color Bends background (hero to footer). Fixed behind content, Prism-themed colors. */
export function LandingBackground() {
  return (
    <div className="fixed inset-0 z-0 min-h-screen w-full h-full bg-[#060010]" aria-hidden>
      <ColorBendsClient
        colors={['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#8b00ff']}
        rotation={-83}
        speed={0.34}
        scale={1.7}
        frequency={.8}
        warpStrength={1}
        mouseInfluence={1}
        parallax={0.5}
        noise={0.1}
        transparent
        autoRotate={0}
        className="w-full h-full"
      />
    </div>
  );
}
