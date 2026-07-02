import * as THREE from "three";
import { createGlowSpriteTexture } from "./particleTexture";
import { CATEGORY_META, type Post } from "../../data/posts";

/**
 * Interactive "content stars": one glowing body per post, placed on a stable
 * inclined orbit well outside the accretion disk so they never fall in. Each
 * carries its Post in `userData.post` for the component's raycaster to read on
 * hover/click. Orbit geometry is derived purely from the post index here, so
 * the content data itself stays free of any 3D placement concerns.
 */
export interface ContentStar {
  mesh: THREE.Mesh;
  glow: THREE.Sprite;
  post: Post;
  radius: number;
  angle: number;
  angularSpeed: number;
  inclination: number;
  hover: number; // eased 0 -> 1
}

export interface ContentStars {
  group: THREE.Group;
  stars: ContentStar[];
  /** Meshes to hand to the raycaster (non-recursive). */
  pickables: THREE.Mesh[];
  /** Currently hovered mesh, set by the component each frame. */
  hovered: THREE.Mesh | null;
  update: (dt: number) => void;
}

export function createContentStars(posts: Post[]): ContentStars {
  const group = new THREE.Group();
  const glowTexture = createGlowSpriteTexture();

  const stars: ContentStar[] = posts.map((post, i) => {
    const color = new THREE.Color(CATEGORY_META[post.category].color);

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 24, 24),
      new THREE.MeshBasicMaterial({ color }),
    );

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.35,
      }),
    );
    glow.scale.setScalar(1.6);
    mesh.add(glow);

    mesh.userData.post = post;
    group.add(mesh);

    // Spread posts across three orbital shells and around the circle so they
    // don't cluster; alternate inclination sign for vertical variety.
    const shell = i % 3;
    const radius = 12 + shell * 4.5 + (i % 2) * 1.5;
    const inclination = THREE.MathUtils.degToRad(
      (i % 2 === 0 ? 1 : -1) * (16 + shell * 8),
    );

    return {
      mesh,
      glow,
      post,
      radius,
      angle: (i / posts.length) * Math.PI * 2,
      angularSpeed: 0.05 + (i % 3) * 0.012,
      inclination,
      hover: 0,
    };
  });

  const api: ContentStars = {
    group,
    stars,
    pickables: stars.map((s) => s.mesh),
    hovered: null,
    update,
  };

  function update(dt: number) {
    for (const star of stars) {
      star.angle += star.angularSpeed * dt;

      const x = star.radius * Math.cos(star.angle);
      const z0 = star.radius * Math.sin(star.angle);
      star.mesh.position.set(
        x,
        z0 * Math.sin(star.inclination),
        z0 * Math.cos(star.inclination),
      );

      // Ease the hover response: gentle 5-10% swell plus a brighter, larger
      // glow so the focused star reads as selectable without snapping.
      const target = api.hovered === star.mesh ? 1 : 0;
      star.hover += (target - star.hover) * Math.min(1, dt * 8);
      const s = 1 + star.hover * 0.09;
      star.mesh.scale.setScalar(s);
      star.glow.material.opacity = 0.35 + star.hover * 0.45;
      star.glow.scale.setScalar(1.6 + star.hover * 0.7);
    }
  }

  return api;
}
