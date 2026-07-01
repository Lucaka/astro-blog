import * as THREE from "three";
import { createGlowSpriteTexture } from "./particleTexture";
import { createPointSpriteMaterial } from "./pointSpriteMaterial";

const BASE_COLOR = new THREE.Color(0xdff0ff);
const TIP_COLOR = new THREE.Color(0x6f9fff);

export interface Jets {
  points: THREE.Points;
  update: (dt: number) => void;
}

/**
 * Twin bipolar jets launched from near the accretion disk's inner edge,
 * streaming outward along the spin axis (Y) at a roughly constant speed and
 * recycling back to the base once they reach the jet length - the outward
 * mirror of the accretion disk's inward spiral-and-recycle particle system.
 */
export function createJets(options?: {
  countPerJet?: number;
  length?: number;
  baseRadius?: number;
  startHeight?: number;
}): Jets {
  const countPerJet = options?.countPerJet ?? 2000;
  const length = options?.length ?? 22;
  const baseRadius = options?.baseRadius ?? 0.15;
  const startHeight = options?.startHeight ?? 1.15;
  const coneSpread = 1.2;
  const outwardSpeed = 9;
  const count = countPerJet * 2;

  const progress = new Float32Array(count);
  const speedVariance = new Float32Array(count);
  const angle = new Float32Array(count);
  const spreadSeed = new Float32Array(count);
  const noiseSeed = new Float32Array(count);
  const sign = new Float32Array(count);

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  function respawn(i: number, atRandomProgress: boolean) {
    progress[i] = atRandomProgress ? Math.random() : Math.random() * 0.03;
    speedVariance[i] = 0.8 + Math.random() * 0.4;
    angle[i] = Math.random() * Math.PI * 2;
    // Biased toward 0 so the jet is denser along its core, with a sparser
    // outer halo - same product-of-two-randoms trick used for disk sizes.
    spreadSeed[i] = Math.random() * Math.random();
    noiseSeed[i] = Math.random() * Math.PI * 2;
    sizes[i] = 0.05 + Math.random() * Math.random() * 0.14;
  }

  for (let i = 0; i < count; i++) {
    sign[i] = i < countPerJet ? 1 : -1;
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

  let elapsed = 0;

  function update(dt: number) {
    elapsed += dt;

    for (let i = 0; i < count; i++) {
      progress[i] += (outwardSpeed * speedVariance[i] * dt) / length;

      if (progress[i] >= 1) {
        respawn(i, false);
      }

      const p = progress[i];
      const y = startHeight + p * length;
      const coneRadius = baseRadius + p * coneSpread;

      const wobblePhase = elapsed * 1.4 + noiseSeed[i];
      const lateralWobble = Math.sin(wobblePhase) * 0.06 * coneRadius;
      const angularWobble = Math.sin(wobblePhase * 0.6 + 1.0) * 0.12;

      const r = coneRadius * spreadSeed[i] + lateralWobble;
      const a = angle[i] + angularWobble;

      tmpColor.copy(BASE_COLOR).lerp(TIP_COLOR, p);

      positionAttr.setXYZ(i, r * Math.cos(a), sign[i] * y, r * Math.sin(a));
      colorAttr.setXYZ(i, tmpColor.r, tmpColor.g, tmpColor.b);
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  }

  return { points, update };
}
