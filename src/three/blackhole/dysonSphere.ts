import * as THREE from "three";
import { createGlowSpriteTexture } from "./particleTexture";
import { createPointSpriteMaterial } from "./pointSpriteMaterial";

export interface DysonSphere {
  group: THREE.Group;
  update: (dt: number) => void;
}

const RING_COLOR = new THREE.Color(0x88ccff);
const DEG        = Math.PI / 180;
const LOCAL_Y    = new THREE.Vector3(0, 1, 0);
const PLATE_Z    = new THREE.Vector3(0, 0, 1);

// Particles laid out in the local XZ plane — the caller tilts the group
function makeRingGroup(radius: number, count: number): THREE.Group {
  const positions = new Float32Array(count * 3);
  const colors    = new Float32Array(count * 3);
  const sizes     = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const phi = (i / count) * Math.PI * 2;
    const dr  = (Math.random() - 0.5) * 0.15;
    const dy  = (Math.random() - 0.5) * 0.15;

    positions[i * 3]     = (radius + dr) * Math.cos(phi);
    positions[i * 3 + 1] = dy;
    positions[i * 3 + 2] = (radius + dr) * Math.sin(phi);

    const brightness  = 0.35 + Math.random() * 0.45;
    colors[i * 3]     = RING_COLOR.r * brightness;
    colors[i * 3 + 1] = RING_COLOR.g * brightness;
    colors[i * 3 + 2] = RING_COLOR.b * brightness;
    sizes[i] = 0.05 + Math.random() * 0.10;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color",    new THREE.BufferAttribute(colors,    3));
  geo.setAttribute("size",     new THREE.BufferAttribute(sizes,     1));

  const pts = new THREE.Points(geo, createPointSpriteMaterial(createGlowSpriteTexture()));
  pts.frustumCulled = false;

  const g = new THREE.Group();
  g.add(pts);
  return g;
}

// Flat polygon panel: faint fill + bright border outline
function makePlate(sides: number, size: number): THREE.Group {
  const g = new THREE.Group();

  g.add(new THREE.Mesh(
    new THREE.CircleGeometry(size, sides),
    new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  ));

  const borderPts: THREE.Vector3[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    borderPts.push(new THREE.Vector3(size * Math.cos(a), size * Math.sin(a), 0));
  }
  g.add(new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(borderPts),
    new THREE.LineBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.60,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  ));

  return g;
}

export function createDysonSphere(): DysonSphere {
  const radius = 14;
  const group  = new THREE.Group();

  // --- Two crossing rings, 60° apart ---
  // Ring 1: tilted 45° around X-axis
  const ring1 = makeRingGroup(radius, 1400);
  ring1.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), 45 * DEG);
  group.add(ring1);

  // Ring 2: tilted 45° around Z-axis — cross angle ≈ 60°
  const ring2 = makeRingGroup(radius, 1400);
  ring2.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), -45 * DEG);
  group.add(ring2);

  // Each ring spins around its own local normal (local Y = plane normal)
  const qSpin1 = new THREE.Quaternion();
  const qSpin2 = new THREE.Quaternion();

  // --- Energy beams: sparse particle chains toward the black hole ---
  const beamPhis    = [0.4, 1.8, 3.3, 4.9];
  const beamPerBeam = 22;
  const totalBeam   = beamPhis.length * beamPerBeam;
  const bPos   = new Float32Array(totalBeam * 3);
  const bColor = new Float32Array(totalBeam * 3);
  const bSize  = new Float32Array(totalBeam);

  let bi = 0;
  for (const phi of beamPhis) {
    const theta = Math.PI / 2 + (Math.random() - 0.5) * 0.35;
    const st = Math.sin(theta);
    const ct = Math.cos(theta);
    const sx = radius * st * Math.cos(phi);
    const sy = radius * ct;
    const sz = radius * st * Math.sin(phi);

    for (let k = 0; k < beamPerBeam; k++) {
      const t          = k / (beamPerBeam - 1);
      bPos[bi * 3]     = sx * (1 - t) + (Math.random() - 0.5) * 0.06;
      bPos[bi * 3 + 1] = sy * (1 - t) + (Math.random() - 0.5) * 0.06;
      bPos[bi * 3 + 2] = sz * (1 - t) + (Math.random() - 0.5) * 0.06;
      const bright      = (0.25 + Math.random() * 0.20) * (1 - t * 0.55);
      bColor[bi * 3]     = RING_COLOR.r * bright;
      bColor[bi * 3 + 1] = RING_COLOR.g * bright;
      bColor[bi * 3 + 2] = RING_COLOR.b * bright;
      bSize[bi] = 0.04 + Math.random() * 0.07;
      bi++;
    }
  }

  const beamGeo = new THREE.BufferGeometry();
  beamGeo.setAttribute("position", new THREE.BufferAttribute(bPos,   3));
  beamGeo.setAttribute("color",    new THREE.BufferAttribute(bColor, 3));
  beamGeo.setAttribute("size",     new THREE.BufferAttribute(bSize,  1));
  const beamPts = new THREE.Points(beamGeo, createPointSpriteMaterial(createGlowSpriteTexture()));
  beamPts.frustumCulled = false;
  group.add(beamPts);

  // --- Dyson plates: hex/oct panels orbiting at three latitude bands ---
  const plateDefs = [
    { theta: 55 * DEG,  phi: 0.2, phiSpeed:  0.020, sides: 6, size: 0.75 },
    { theta: 55 * DEG,  phi: 1.8, phiSpeed:  0.018, sides: 8, size: 0.65 },
    { theta: 55 * DEG,  phi: 3.4, phiSpeed:  0.022, sides: 6, size: 0.80 },
    { theta: 55 * DEG,  phi: 5.0, phiSpeed:  0.019, sides: 8, size: 0.70 },
    { theta: 90 * DEG,  phi: 0.9, phiSpeed: -0.016, sides: 6, size: 0.85 },
    { theta: 90 * DEG,  phi: 2.5, phiSpeed: -0.018, sides: 8, size: 0.75 },
    { theta: 90 * DEG,  phi: 4.1, phiSpeed: -0.015, sides: 6, size: 0.80 },
    { theta: 90 * DEG,  phi: 5.7, phiSpeed: -0.020, sides: 8, size: 0.70 },
    { theta: 125 * DEG, phi: 1.1, phiSpeed:  0.017, sides: 6, size: 0.75 },
    { theta: 125 * DEG, phi: 3.0, phiSpeed:  0.021, sides: 8, size: 0.65 },
    { theta: 125 * DEG, phi: 4.7, phiSpeed:  0.018, sides: 6, size: 0.70 },
  ];

  const plates: Array<{ g: THREE.Group; theta: number; phi: number; phiSpeed: number }> = [];
  const outward = new THREE.Vector3();

  for (const def of plateDefs) {
    const pg = makePlate(def.sides, def.size);
    group.add(pg);

    const st = Math.sin(def.theta);
    const ct = Math.cos(def.theta);
    pg.position.set(
      radius * st * Math.cos(def.phi),
      radius * ct,
      radius * st * Math.sin(def.phi),
    );
    outward.set(st * Math.cos(def.phi), ct, st * Math.sin(def.phi));
    pg.quaternion.setFromUnitVectors(PLATE_Z, outward);

    plates.push({ g: pg, theta: def.theta, phi: def.phi, phiSpeed: def.phiSpeed });
  }

  function update(dt: number) {
    // Spin each ring around its local normal (local Y = plane normal after tilt)
    qSpin1.setFromAxisAngle(LOCAL_Y,  0.013 * dt);
    ring1.quaternion.multiply(qSpin1);

    qSpin2.setFromAxisAngle(LOCAL_Y, -0.010 * dt);
    ring2.quaternion.multiply(qSpin2);

    // Orbit plates around world Y-axis, always facing radially outward
    for (const p of plates) {
      p.phi += p.phiSpeed * dt;
      const st = Math.sin(p.theta);
      const ct = Math.cos(p.theta);
      const x  = radius * st * Math.cos(p.phi);
      const y  = radius * ct;
      const z  = radius * st * Math.sin(p.phi);
      p.g.position.set(x, y, z);
      outward.set(st * Math.cos(p.phi), ct, st * Math.sin(p.phi));
      p.g.quaternion.setFromUnitVectors(PLATE_Z, outward);
    }
  }

  return { group, update };
}
