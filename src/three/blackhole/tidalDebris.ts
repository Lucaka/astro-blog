import * as THREE from "three";
import { createGlowSpriteTexture } from "./particleTexture";
import { createPointSpriteMaterial } from "./pointSpriteMaterial";

const DEBRIS_COLOR = new THREE.Color(0x8a3a15);

export function createTidalDebris(): THREE.Points {
  const streamDefs = [
    { phi0: 0.8,  inc:  0.15 },
    { phi0: 2.2,  inc: -0.10 },
    { phi0: 4.5,  inc:  0.20 },
  ];

  const pPerStream = 180;
  const total = streamDefs.length * pPerStream;

  const positions = new Float32Array(total * 3);
  const colors    = new Float32Array(total * 3);
  const sizes     = new Float32Array(total);

  for (let s = 0; s < streamDefs.length; s++) {
    const { phi0, inc } = streamDefs[s];

    for (let i = 0; i < pPerStream; i++) {
      const idx  = s * pPerStream + i;
      const t    = i / (pPerStream - 1); // 0 = inner (r=9), 1 = outer (r=14)
      const r    = 9 + t * 5;

      // Slight azimuthal sweep following the debris arc
      const phi  = phi0 + t * 0.55 + (Math.random() - 0.5) * 0.20;
      const y    = r * Math.sin(inc) * t + (Math.random() - 0.5) * 0.25;

      positions[idx * 3]     = r * Math.cos(phi);
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = r * Math.sin(phi);

      // Brighter at the inner edge where it feeds into the accretion disk
      const brightness = (0.18 + Math.random() * 0.28) * (1 - t * 0.40);
      colors[idx * 3]     = DEBRIS_COLOR.r * brightness;
      colors[idx * 3 + 1] = DEBRIS_COLOR.g * brightness;
      colors[idx * 3 + 2] = DEBRIS_COLOR.b * brightness;

      sizes[idx] = 0.04 + Math.random() * 0.09;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color",    new THREE.BufferAttribute(colors,    3));
  geometry.setAttribute("size",     new THREE.BufferAttribute(sizes,     1));

  const material = createPointSpriteMaterial(createGlowSpriteTexture());
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}
