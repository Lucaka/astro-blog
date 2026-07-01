import * as THREE from "three";
import { createGlowSpriteTexture } from "./particleTexture";
import { createPointSpriteMaterial } from "./pointSpriteMaterial";

const COLOR_STOPS: Array<{ t: number; color: THREE.Color }> = [
  { t: 0, color: new THREE.Color(0xcfe8ff) }, // innermost: blue-white, hottest
  { t: 0.25, color: new THREE.Color(0xffffff) },
  { t: 0.55, color: new THREE.Color(0xffa64d) },
  { t: 1, color: new THREE.Color(0x661a0d) }, // outer edge: cool deep red
];

function colorForT(t: number, out: THREE.Color): THREE.Color {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const a = COLOR_STOPS[i];
    const b = COLOR_STOPS[i + 1];
    if (clamped >= a.t && clamped <= b.t) {
      const localT = (clamped - a.t) / (b.t - a.t);
      return out.copy(a.color).lerp(b.color, localT);
    }
  }
  return out.copy(COLOR_STOPS[COLOR_STOPS.length - 1].color);
}

export interface AccretionDisk {
  points: THREE.Points;
  update: (dt: number) => void;
}

/**
 * Single unified particle system: every particle continuously spirals
 * inward and is recycled to the outer edge once it reaches the center, so
 * "the accretion disk" and "particles falling into the black hole" are the
 * same population rather than two separate effects.
 */
export function createAccretionDisk(options?: {
  count?: number;
  innerRadius?: number;
  outerRadius?: number;
}): AccretionDisk {
  const count = options?.count ?? 9000;
  const innerRadius = options?.innerRadius ?? 1.15;
  const outerRadius = options?.outerRadius ?? 9;

  const radius = new Float32Array(count);
  const angle = new Float32Array(count);
  const speedVariance = new Float32Array(count);
  const verticalSeed = new Float32Array(count);

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  function respawn(i: number, atRandomRadius: boolean) {
    radius[i] = atRandomRadius
      ? THREE.MathUtils.randFloat(innerRadius, outerRadius)
      : THREE.MathUtils.randFloat(outerRadius * 0.82, outerRadius);
    angle[i] = Math.random() * Math.PI * 2;
    speedVariance[i] = 0.75 + Math.random() * 0.5;
    verticalSeed[i] = THREE.MathUtils.randFloatSpread(2);
    sizes[i] = 0.08 + Math.random() * Math.random() * 0.16;
  }

  for (let i = 0; i < count; i++) {
    respawn(i, true);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const material = createPointSpriteMaterial(createGlowSpriteTexture());
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  const tmpColor = new THREE.Color();
  const positionAttr = geometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;
  const colorAttr = geometry.getAttribute("color") as THREE.BufferAttribute;

  function update(dt: number) {
    const span = outerRadius - innerRadius;

    for (let i = 0; i < count; i++) {
      // Faster infall and faster (Keplerian-like) rotation the closer a
      // particle gets to the center.
      const r = radius[i];
      const inwardSpeed = (0.55 * speedVariance[i] * outerRadius) / r;
      const angularSpeed = 2.4 / Math.pow(r, 1.5);

      radius[i] = r - inwardSpeed * dt;
      angle[i] += angularSpeed * dt;

      if (radius[i] <= innerRadius) {
        respawn(i, false);
      }

      const rNow = radius[i];
      const a = angle[i];
      const thickness = 0.35 * Math.pow(rNow / outerRadius, 1.15);

      positionAttr.setXYZ(
        i,
        rNow * Math.cos(a),
        verticalSeed[i] * thickness,
        rNow * Math.sin(a),
      );

      const t = (rNow - innerRadius) / span;
      colorForT(t, tmpColor);
      colorAttr.setXYZ(i, tmpColor.r, tmpColor.g, tmpColor.b);
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  }

  return { points, update };
}
