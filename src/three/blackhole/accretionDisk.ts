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
  update: (dt: number, camera?: THREE.Camera) => void;
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
  const count = options?.count ?? 7000;
  const innerRadius = options?.innerRadius ?? 1.15;
  const outerRadius = options?.outerRadius ?? 9;

  const radius = new Float32Array(count);
  const angle = new Float32Array(count);
  const speedVariance = new Float32Array(count);
  const verticalSeed = new Float32Array(count);
  const brightness = new Float32Array(count);
  const noiseSeed = new Float32Array(count);

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
    sizes[i] = 0.06 + Math.random() * Math.random() * 0.26;
    brightness[i] = 0.42 + Math.random() * 0.5;
    noiseSeed[i] = Math.random() * Math.PI * 2;
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

  let elapsed = 0;

  // Relativistic Doppler beaming: the side of the disk rotating toward the
  // viewer is boosted, the receding side dimmed. Strength governs how extreme
  // the light/dark asymmetry is; it is applied as a per-particle multiplier
  // driven by the dot product of the particle's orbital velocity with the
  // line of sight.
  const dopplerStrength = 0.75;
  // Projected (XZ) unit direction from the disk center toward the camera,
  // refreshed once per frame — far cheaper than a per-particle recompute and
  // accurate enough since the disk is small relative to the camera distance.
  let camDirX = 0;
  let camDirZ = 1;

  function update(dt: number, camera?: THREE.Camera) {
    const span = outerRadius - innerRadius;
    elapsed += dt;

    if (camera) {
      const cx = camera.position.x;
      const cz = camera.position.z;
      const len = Math.hypot(cx, cz);
      if (len > 1e-4) {
        camDirX = cx / len;
        camDirZ = cz / len;
      }
    }

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

      // Light turbulence: a per-particle sine wobble layered on top of the
      // clean Keplerian spiral, purely cosmetic (display-only, never fed
      // back into radius[i]/angle[i]) so the underlying physics stays exact.
      const wobblePhase = elapsed * 1.3 + noiseSeed[i];
      const radialWobble = Math.sin(wobblePhase) * 0.07 * rNow;
      const angularWobble = Math.sin(wobblePhase * 0.7 + 1.0) * 0.09;
      const verticalWobble = Math.sin(wobblePhase * 1.6 + 2.0) * thickness * 0.6;

      const rDisplay = rNow + radialWobble;
      const aDisplay = a + angularWobble;

      positionAttr.setXYZ(
        i,
        rDisplay * Math.cos(aDisplay),
        verticalSeed[i] * thickness + verticalWobble,
        rDisplay * Math.sin(aDisplay),
      );

      const t = (rNow - innerRadius) / span;
      colorForT(t, tmpColor);

      // Orbital velocity direction (XZ) is tangent to the circle: for a
      // position of (cos a, sin a) moving with increasing angle it points
      // along (-sin a, cos a). Beaming brightens particles whose motion has
      // a component toward the camera and dims the receding side. Inner
      // (faster) orbits are boosted more, mimicking the velocity dependence
      // of relativistic beaming.
      const velDot = -Math.sin(a) * camDirX + Math.cos(a) * camDirZ;
      const speedFactor = Math.min(1.4, outerRadius / rNow);
      const beaming = THREE.MathUtils.clamp(
        1 + dopplerStrength * speedFactor * velDot,
        0.15,
        1.75,
      );

      tmpColor.multiplyScalar(brightness[i] * beaming);
      colorAttr.setXYZ(i, tmpColor.r, tmpColor.g, tmpColor.b);
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  }

  return { points, update };
}
