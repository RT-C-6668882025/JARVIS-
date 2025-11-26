import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { EARTH_TEXTURE_URL, EARTH_BUMP_URL, COLORS, CONTINENTS } from '../constants';

interface HologramEarthProps {
  rotationRef: React.MutableRefObject<{ x: number; y: number }>;
  scaleRef: React.MutableRefObject<number>;
  onRegionChange: (region: string) => void;
}

const HologramEarth: React.FC<HologramEarthProps> = ({ rotationRef, scaleRef, onRegionChange }) => {
  const earthRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const [colorMap, bumpMap] = useLoader(THREE.TextureLoader, [
    EARTH_TEXTURE_URL,
    EARTH_BUMP_URL
  ]);

  // Materials
  const earthMaterial = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      map: colorMap,
      bumpMap: bumpMap,
      bumpScale: 0.05,
      specular: new THREE.Color(COLORS.secondary),
      shininess: 10,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
    });
  }, [colorMap, bumpMap]);

  const wireframeMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: COLORS.primary,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        c: { value: 0.6 },
        p: { value: 4.0 },
        glowColor: { value: new THREE.Color(COLORS.primary) },
        viewVector: { value: new THREE.Vector3() }
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(c - dot(vNormal, vNormel), p);
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4( glow, 1.0 );
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
  }, []);

  useFrame((state) => {
    if (earthRef.current) {
      // Smooth lerp for rotation
      earthRef.current.rotation.y = THREE.MathUtils.lerp(
        earthRef.current.rotation.y,
        rotationRef.current.y,
        0.1
      );
      earthRef.current.rotation.x = THREE.MathUtils.lerp(
        earthRef.current.rotation.x,
        rotationRef.current.x,
        0.1
      );

      // Smooth lerp for scale
      const targetScale = scaleRef.current;
      earthRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

      // Calculate facing continent based on Y rotation
      // Normalize rotation to 0-360 degrees
      let deg = THREE.MathUtils.radToDeg(earthRef.current.rotation.y) % 360;
      if (deg < 0) deg += 360;
      
      // The texture maps 0 at Prime Meridian, but ThreeJS rotation works inversely to longitude
      // We approximate the facing longitude.
      const facingLon = (360 - deg) % 360;
      
      const region = CONTINENTS.find(c => facingLon >= c.start && facingLon < c.end);
      if (region) {
        onRegionChange(region.name);
      }
    }

    if (atmosphereRef.current) {
      atmosphereRef.current.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(
        state.camera.position,
        atmosphereRef.current.position
      );
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += 0.002;
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    }
  });

  return (
    <group ref={earthRef}>
      {/* Main Earth Sphere */}
      <mesh geometry={new THREE.SphereGeometry(1.5, 64, 64)} material={earthMaterial} />
      
      {/* Wireframe Overlay */}
      <mesh geometry={new THREE.SphereGeometry(1.52, 24, 24)} material={wireframeMaterial} />

      {/* Atmosphere Glow */}
      <mesh ref={atmosphereRef} geometry={new THREE.SphereGeometry(1.8, 64, 64)} material={atmosphereMaterial} />

      {/* Orbital Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 2.3, 64]} />
        <meshBasicMaterial color={COLORS.primary} transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

export default HologramEarth;