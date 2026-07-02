import * as THREE from "three";
import { createGlowSpriteTexture } from "./particleTexture";
import { createPointSpriteMaterial } from "./pointSpriteMaterial";

/**
 * Interstellar dust and gas: a handful of large, faint, colored particle
 * clouds scattered on a distant spherical shell around the scene, sitting
 * behind the starfield to give the void a sense of depth and volume. Each
 * clump is a Gaussian blob of oversized glow sprites at low brightness, so
 * they read as soft nebulosity rather than discrete points. Purely
 * decorative and static — no per-frame update.
 */
export function createNebula(options?: {
  clouds?: number;
  particlesPerCloud?: number;
  radius?: number;
}): THREE.Points {
  const clouds = options?.clouds ?? 6;
  const particlesPerCloud = options?.particlesPerCloud ?? 260;
  const radius = options?.radius ?? 150;
  const total = clouds * particlesPerCloud;

  // A cool interstellar palette: teal, indigo, magenta and deep blue.
  const palette = [
    new THREE.Color(0x2a4a6f),
    new THREE.Color(0x3a2a6a),
    new THREE.Color(0x1f5a5a),
    new THREE.Color(0x5a2a55),
    new THREE.Color(0x244a7a),
    new THREE.Color(0x402a60),
  ];

  const positions = new Float32Array(total * 3);
  const colors = new Float32Array(total * 3);
  const sizes = new Float32Array(total);

  let idx = 0;
  for (let c = 0; c < clouds; c++) {
    // Random center on the distant shell.
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
    const r = radius * (0.85 + Math.random() * 0.3);
    const cx = r * Math.sin(phi) * Math.cos(theta);
    const cy = r * Math.cos(phi);
    const cz = r * Math.sin(phi) * Math.sin(theta);

    const spread = 18 + Math.random() * 22;
    const tint = palette[c % palette.length];

    for (let i = 0; i < particlesPerCloud; i++) {
      // Gaussian-ish falloff toward the cloud center (sum of uniforms).
      const gx = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const gy = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const gz = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

      positions[idx * 3] = cx + gx * spread;
      positions[idx * 3 + 1] = cy + gy * spread;
      positions[idx * 3 + 2] = cz + gz * spread;

      // Faint, with slight per-particle variation around the cloud tint.
      const brightness = 0.05 + Math.random() * 0.12;
      colors[idx * 3] = tint.r * brightness;
      colors[idx * 3 + 1] = tint.g * brightness;
      colors[idx * 3 + 2] = tint.b * brightness;

      // Large soft sprites so clumps blend into continuous nebulosity.
      sizes[idx] = 6 + Math.random() * Math.random() * 14;
      idx++;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const points = new THREE.Points(
    geometry,
    createPointSpriteMaterial(createGlowSpriteTexture()),
  );
  points.frustumCulled = false;
  return points;
}
