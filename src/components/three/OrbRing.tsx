import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function OrbRing() {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const orbRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.3;
      groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.15;
    }
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 0.8;
    if (ring2Ref.current) ring2Ref.current.rotation.x = t * 0.6;
    if (orbRef.current) {
      (orbRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.8 + Math.sin(t * 2) * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -3]}>
      {/* Core orb */}
      <mesh ref={orbRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#7c3aed"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Inner ring */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.03, 16, 100]} />
        <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={1} />
      </mesh>

      {/* Outer ring */}
      <mesh ref={ring2Ref} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[1.8, 0.02, 16, 100]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.7} />
      </mesh>

      {/* Point light */}
      <pointLight color="#8b5cf6" intensity={3} distance={8} />
    </group>
  );
}
