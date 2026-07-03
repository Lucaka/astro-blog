import * as THREE from "three";
import { createGlowSpriteTexture } from "./particleTexture";
import type { Galaxy } from "../../utils/galaxies";

/**
 * Group-view impostors: in the zoomed-out "galaxy group" view each galaxy is
 * rendered as a cheap stand-in — a bright core sprite, a small spiral of
 * additive points and a name label — instead of its full black-hole scene.
 * Only the galaxy the camera dives into ever gets real content stars, so the
 * group view stays flat-cost no matter how many volumes the blog grows.
 */
export interface GalaxyImpostor {
  galaxy: Galaxy;
  /** Anchor group positioned by the timeline layout. */
  anchor: THREE.Group;
  /** Oversized invisible sphere so small galaxies stay easy to click. */
  hitbox: THREE.Mesh;
  core: THREE.Sprite;
  disc: THREE.Points;
  label: THREE.Sprite;
  baseY: number;
  phase: number;
  spinSpeed: number;
  hover: number; // eased 0 -> 1
}

export interface GalaxyImpostors {
  group: THREE.Group;
  impostors: GalaxyImpostor[];
  /** Hitboxes to hand to the raycaster; each carries `userData.galaxy`. */
  pickables: THREE.Mesh[];
  /** Currently hovered hitbox, set by the component each frame. */
  hovered: THREE.Mesh | null;
  findById: (id: string) => GalaxyImpostor | null;
  /** Re-layout so the active galaxy sits at the origin, and re-label it. */
  setActive: (id: string) => void;
  /** Global fade used by the view transition (0 hidden, 1 fully shown). */
  setOpacity: (value: number) => void;
  update: (dt: number, motion: number) => void;
  dispose: () => void;
}

/** Distance between neighbouring galaxies on the chronological line. */
const SPACING = 26;

/** Per-galaxy tints so volumes are telling apart at a glance. */
const TINTS = [0x8ab4ff, 0xffd54a, 0xb07cff, 0x5fe6d0, 0xff9d6f, 0xf0f0f0];

function createLabelTexture(galaxy: Galaxy, isActive: boolean): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = isActive ? "#ffffff" : "rgba(238, 242, 255, 0.9)";
  ctx.font =
    "600 42px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(galaxy.name + (isActive ? "（目前）" : ""), 256, 52);
  ctx.fillStyle = "rgba(178, 192, 232, 0.85)";
  ctx.font =
    "28px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(`${galaxy.era} · ${galaxy.posts.length} 顆星`, 256, 110);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createGalaxyImpostors(galaxies: Galaxy[]): GalaxyImpostors {
  const group = new THREE.Group();
  const glowTexture = createGlowSpriteTexture();

  const impostors: GalaxyImpostor[] = galaxies.map((galaxy, gi) => {
    const anchor = new THREE.Group();
    const tint = new THREE.Color(TINTS[gi % TINTS.length]);

    // Bright core: the galaxy's "black hole" seen from far away.
    const core = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: tint.clone().lerp(new THREE.Color(0xffffff), 0.55),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.9,
      }),
    );
    core.scale.setScalar(5.5);
    anchor.add(core);

    // Two-armed mini spiral of additive points, brighter toward the center.
    const count = 110;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const arm = i % 2;
      const angle =
        arm * Math.PI + t * Math.PI * 2.6 + (Math.random() - 0.5) * 0.45;
      const r = 0.5 + t * 4.6 + (Math.random() - 0.5) * 0.5;
      positions[i * 3] = r * Math.cos(angle);
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 2] = r * Math.sin(angle);
      c.copy(tint)
        .lerp(new THREE.Color(0xffffff), (1 - t) * 0.5)
        .multiplyScalar(1 - t * 0.55);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const discGeometry = new THREE.BufferGeometry();
    discGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    discGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const disc = new THREE.Points(
      discGeometry,
      new THREE.PointsMaterial({
        map: glowTexture,
        size: 0.55,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.9,
      }),
    );
    // Give each disc its own slight tilt so the group doesn't look stamped.
    const discPivot = new THREE.Group();
    discPivot.rotation.set(
      (Math.random() - 0.5) * 0.7,
      0,
      (Math.random() - 0.5) * 0.7,
    );
    discPivot.add(disc);
    anchor.add(discPivot);

    const label = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createLabelTexture(galaxy, false),
        transparent: true,
        depthWrite: false,
        opacity: 1,
      }),
    );
    label.scale.set(12, 3.75, 1);
    label.position.y = -6.4;
    anchor.add(label);

    // Fixed-size invisible hit sphere: visual size may vary, click target
    // must not.
    const hitbox = new THREE.Mesh(
      new THREE.SphereGeometry(4.6, 12, 12),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    hitbox.userData.galaxy = galaxy;
    anchor.add(hitbox);

    group.add(anchor);

    return {
      galaxy,
      anchor,
      hitbox,
      core,
      disc,
      label,
      baseY: 0,
      phase: gi * 1.7,
      spinSpeed: 0.1 + (gi % 3) * 0.03,
      hover: 0,
    };
  });

  let time = 0;

  const api: GalaxyImpostors = {
    group,
    impostors,
    pickables: impostors.map((im) => im.hitbox),
    hovered: null,
    findById: (id) => impostors.find((im) => im.galaxy.id === id) ?? null,
    setActive,
    setOpacity,
    update,
    dispose,
  };

  function setActive(id: string) {
    // Chronological timeline layout, active galaxy at the origin (where the
    // full black-hole scene lives), older volumes to the left, newer to the
    // right, with slight drift so the line reads as space rather than a menu.
    const activeIndex = Math.max(
      0,
      impostors.findIndex((im) => im.galaxy.id === id),
    );
    impostors.forEach((im, i) => {
      const offset = i - activeIndex;
      im.baseY = ((i % 2) * 2 - 1) * 1.6;
      im.anchor.position.set(offset * SPACING, im.baseY, ((i % 3) - 1) * -5);

      const isActive = i === activeIndex;
      im.label.material.map?.dispose();
      im.label.material.map = createLabelTexture(im.galaxy, isActive);
      im.label.material.needsUpdate = true;
      im.core.material.opacity = isActive ? 1 : 0.9;
    });
  }

  function setOpacity(value: number) {
    for (const im of impostors) {
      im.core.material.opacity = value * 0.9;
      (im.disc.material as THREE.PointsMaterial).opacity = value * 0.9;
      im.label.material.opacity = value;
    }
  }

  function update(dt: number, motion: number) {
    time += dt;
    for (const im of impostors) {
      im.disc.rotation.y += im.spinSpeed * dt * motion;
      im.anchor.position.y =
        im.baseY + Math.sin(time * 0.4 + im.phase) * 0.5 * motion;

      // Same calm hover swell the content stars use.
      const target = api.hovered === im.hitbox ? 1 : 0;
      im.hover += (target - im.hover) * Math.min(1, dt * 8);
      im.core.scale.setScalar(5.5 * (1 + im.hover * 0.18));
      im.disc.scale.setScalar(1 + im.hover * 0.1);
    }
  }

  function dispose() {
    for (const im of impostors) {
      im.core.material.dispose();
      im.disc.geometry.dispose();
      (im.disc.material as THREE.Material).dispose();
      im.label.material.map?.dispose();
      im.label.material.dispose();
      im.hitbox.geometry.dispose();
      (im.hitbox.material as THREE.Material).dispose();
    }
    glowTexture.dispose();
  }

  return api;
}
