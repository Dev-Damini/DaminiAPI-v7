import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function FloatingGrid() {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame(({ clock }) => {
    if (!gridRef.current) return;
    const t = clock.getElapsedTime();
    gridRef.current.position.z = (t * 0.5) % 2;
    gridRef.current.material = new THREE.LineBasicMaterial({
      color: '#1e1b4b',
      transparent: true,
      opacity: 0.3,
    });
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[80, 40, '#1e1b4b', '#1e1b4b']}
      rotation={[Math.PI / 2, 0, 0]}
      position={[0, 0, -8]}
    />
  );
}
