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
  /** Star highlighted from the sidebar list: same visual as hover. */
  highlighted: ContentStar | null;
  /** Show only these categories (null = show everything). */
  setFilter: (categories: Set<PostCategory> | null) => void;
  findBySlug: (slug: string) => ContentStar | null;
  /**
   * `motion` scales orbital movement only (reading mode / reduced motion).
   * `camera`, when given, lets a star that fills the frame drop its bloom.
   */
  update: (dt: number, motion: number, camera?: THREE.Camera) => void;
  /** Free GPU resources; call when swapping to another galaxy's stars. */
  dispose: () => void;
}

const PLANET_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec2 vUv;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const PLANET_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uNear;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec2 vUv;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorld);
    float ndv = clamp(dot(n, viewDir), 0.0, 1.0);
    vec3 lightDir = normalize(vec3(0.45, 0.82, 0.5));
    float lambert = clamp(dot(n, lightDir), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 2.5);
    vec3 tex = texture2D(uMap, vUv).rgb;
    vec3 albedo = uColor * (0.38 + 0.72 * tex);
    float shade = 0.22 + 0.78 * lambert;
    // Up close the sphere covers enough pixels that a bright fill blooms
    // into a flat white disc. Drop the body under the bloom threshold and
    // keep a thin rim so the surface texture stays readable.
    float body = mix(1.0, 0.34, uNear);
    float rim = fres * mix(0.42, 0.1, uNear);
    vec3 color = albedo * shade * body + uColor * rim;
    gl_FragColor = vec4(color, uOpacity);
  }
`;

/** Shared grayscale albedo: bands, speckles and a few craters. */
function createPlanetTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const sky = ctx.createLinearGradient(0, 0, 0, size);
  sky.addColorStop(0, "#8e8e8e");
  sky.addColorStop(0.5, "#d8d8d8");
  sky.addColorStop(1, "#7a7a7a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y++) {
    const band = 0.5 + 0.5 * Math.sin(y * 0.09 + Math.sin(y * 0.02) * 2.2);
    ctx.fillStyle = `rgba(255,255,255,${0.02 + band * 0.07})`;
    ctx.fillRect(0, y, size, 1);
  }

  for (let i = 0; i < 140; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1 + Math.random() * 2.4;
    ctx.fillStyle = `rgba(40,40,48,${0.25 + Math.random() * 0.45})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 18; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 6 + Math.random() * 16;
    const g = ctx.createRadialGradient(
      x - r * 0.25,
      y - r * 0.3,
      r * 0.15,
      x,
      y,
      r,
    );
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(0.45, "rgba(30,30,36,0.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

export function createContentStars(posts: Post[]): ContentStars {
  const group = new THREE.Group();
  const glowTexture = createGlowSpriteTexture();
  const planetMap = createPlanetTexture();
  const geometry = new THREE.SphereGeometry(0.32, 48, 32);

  const stars: ContentStar[] = posts.map((post, i) => {
    const color = new THREE.Color(CATEGORY_META[post.category].color);

    const mesh = new THREE.Mesh(
      geometry,
      new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: planetMap },
          uColor: { value: color },
          uOpacity: { value: 1 },
          uNear: { value: 0 },
        },
        vertexShader: PLANET_VERT,
        fragmentShader: PLANET_FRAG,
        transparent: true,
      }),
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
    glow.scale.setScalar(0.72);
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
    highlighted: null,
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
    if (
      api.highlighted &&
      filter &&
      !filter.has(api.highlighted.post.category)
    ) {
      api.highlighted = null;
    }
  }

  function update(dt: number, motion: number, camera?: THREE.Camera) {
    for (const star of stars) {
      const highlighted =
        api.hovered === star.mesh ||
        api.focused === star ||
        api.highlighted === star;

      // A moving target is hard to click: hover, search focus and the
      // sidebar highlight pause the orbit completely.
      if (!highlighted) {
        star.angle += star.angularSpeed * dt * motion;
      }

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
      const material = star.mesh.material as THREE.ShaderMaterial;
      material.uniforms.uOpacity.value = visibility;

      // 0 when the star is a small point, 1 when it fills the view.
      let near = 0;
      if (camera) {
        const dist = star.mesh.position.distanceTo(camera.position);
        near = THREE.MathUtils.smoothstep(dist, 14, 6);
      }
      material.uniforms.uNear.value = near;
      // The sprite used to be several times the sphere, so bloom turned every
      // star into a flat white disc. Keep a thin halo and let the shaded
      // surface read; pull the halo in further when the star fills the frame.
      const glowScale = 1 - near * 0.92;
      star.glow.material.opacity =
        (0.18 + star.hover * 0.22) * visibility * glowScale;
      star.glow.scale.setScalar((0.72 + star.hover * 0.16) * (1 - near * 0.55));
    }
  }

  function dispose() {
    for (const star of stars) {
      (star.mesh.material as THREE.Material).dispose();
      star.glow.material.dispose();
    }
    geometry.dispose();
    planetMap.dispose();
    glowTexture.dispose();
  }

  return api;
}
