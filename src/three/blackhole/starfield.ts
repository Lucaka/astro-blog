import * as THREE from "three";
import { createGlowSpriteTexture } from "./particleTexture";
import { createPointSpriteMaterial } from "./pointSpriteMaterial";

/** Procedurally generated point starfield surrounding the whole scene. */
export function createStarfield(count = 4000, radius = 120): THREE.Points {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    // Uniform-ish distribution on a spherical shell so stars surround the camera.
    const r = radius * (0.5 + Math.random() * 0.5);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    sizes[i] = Math.random() * Math.random() * 2.2 + 0.15;

    const brightness = 0.6 + Math.random() * 0.4;
    const tint = Math.random();
    if (tint < 0.15) {
      color.setRGB(0.7 * brightness, 0.8 * brightness, 1.0 * brightness);
    } else if (tint < 0.3) {
      color.setRGB(1.0 * brightness, 0.85 * brightness, 0.7 * brightness);
    } else {
      color.setRGB(brightness, brightness, brightness);
    }
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = createPointSpriteMaterial(createGlowSpriteTexture());

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}
