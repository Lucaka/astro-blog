import * as THREE from "three";
import { createGlowSpriteTexture } from "./particleTexture";
import { CATEGORY_META, type Post, type PostCategory } from "../../data/posts";

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
  dim: number; // eased 0 -> 1 while filtered out by the legend
}

export interface ContentStars {
  group: THREE.Group;
  stars: ContentStar[];
  /** Meshes to hand to the raycaster (filtered-out stars are excluded). */
  pickables: THREE.Mesh[];
  /** Currently hovered mesh, set by the component each frame. */
  hovered: THREE.Mesh | null;
  /** Star singled out by search: pinned in place and highlighted like hover. */
  focused: ContentStar | null;
  /** Show only these categories (null = show everything). */
  setFilter: (categories: Set<PostCategory> | null) => void;
  findBySlug: (slug: string) => ContentStar | null;
  /** `motion` scales orbital movement only (reading mode / reduced motion). */
  update: (dt: number, motion: number) => void;
  /** Free GPU resources; call when swapping to another galaxy's stars. */
  dispose: () => void;
}

export function createContentStars(posts: Post[]): ContentStars {
  const group = new THREE.Group();
  const glowTexture = createGlowSpriteTexture();

  const stars: ContentStar[] = posts.map((post, i) => {
    const color = new THREE.Color(CATEGORY_META[post.category].color);

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 24, 24),
      new THREE.MeshBasicMaterial({ color, transparent: true }),
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
      dim: 0,
    };
  });

  let filter: Set<PostCategory> | null = null;

  const api: ContentStars = {
    group,
    stars,
    pickables: stars.map((s) => s.mesh),
    hovered: null,
    focused: null,
    setFilter,
    findBySlug: (slug) => stars.find((s) => s.post.slug === slug) ?? null,
    update,
    dispose,
  };

  function setFilter(categories: Set<PostCategory> | null) {
    filter = categories && categories.size > 0 ? categories : null;
    api.pickables = stars
      .filter((s) => !filter || filter.has(s.post.category))
      .map((s) => s.mesh);
    if (api.focused && filter && !filter.has(api.focused.post.category)) {
      api.focused = null;
    }
  }

  function update(dt: number, motion: number) {
    for (const star of stars) {
      const highlighted =
        api.hovered === star.mesh || api.focused === star;

      // A moving target is hard to click: hovering (or search-focusing) a
      // star nearly stops its orbit so it can be selected calmly.
      const orbitScale = highlighted ? 0.08 : 1;
      star.angle += star.angularSpeed * dt * motion * orbitScale;

      const x = star.radius * Math.cos(star.angle);
      const z0 = star.radius * Math.sin(star.angle);
      star.mesh.position.set(
        x,
        z0 * Math.sin(star.inclination),
        z0 * Math.cos(star.inclination),
      );

      // Ease the hover response: gentle 5-10% swell plus a brighter, larger
      // glow so the focused star reads as selectable without snapping.
      const target = highlighted ? 1 : 0;
      star.hover += (target - star.hover) * Math.min(1, dt * 8);

      // Ease toward the legend filter: stars outside the active categories
      // fade to a faint ember instead of vanishing, keeping the sky coherent.
      const dimTarget = filter && !filter.has(star.post.category) ? 1 : 0;
      star.dim += (dimTarget - star.dim) * Math.min(1, dt * 6);

      const s = 1 + star.hover * 0.09;
      star.mesh.scale.setScalar(s);
      const visibility = 1 - star.dim * 0.88;
      (star.mesh.material as THREE.MeshBasicMaterial).opacity = visibility;
      star.glow.material.opacity = (0.35 + star.hover * 0.45) * visibility;
      star.glow.scale.setScalar(1.6 + star.hover * 0.7);
    }
  }

  function dispose() {
    for (const star of stars) {
      star.mesh.geometry.dispose();
      (star.mesh.material as THREE.Material).dispose();
      star.glow.material.dispose();
    }
    glowTexture.dispose();
  }

  return api;
}
