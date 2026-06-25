import { Canvas } from '@react-three/fiber';
import { Suspense, memo } from 'react';
import ParticleField from './ParticleField';
import FloatingGrid from './FloatingGrid';
import OrbRing from './OrbRing';

function ThreeBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 1,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        gl={{ antialias: false, alpha: true }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.2} />
        <Suspense fallback={null}>
          <ParticleField count={900} />
          <FloatingGrid />
          <OrbRing />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default memo(ThreeBackground);
