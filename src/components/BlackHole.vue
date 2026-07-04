<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

import { createStarfield } from "../three/blackhole/starfield";
import { createNebula } from "../three/blackhole/nebula";
import { createGravityGrid } from "../three/blackhole/gravityGrid";
import { createAccretionDisk } from "../three/blackhole/accretionDisk";
import { createOrbitingBodies } from "../three/blackhole/orbitingBodies";
import { createJets } from "../three/blackhole/jets";
import { LensingShader } from "../three/blackhole/lensingShader";
import { createDysonSphere } from "../three/blackhole/dysonSphere";
import { createEinsteinRing } from "../three/blackhole/einsteinRing";
import { createTidalDebris } from "../three/blackhole/tidalDebris";
import { createContentStars } from "../three/blackhole/contentStars";
import { createGalaxyImpostors } from "../three/blackhole/galaxyImpostors";
import { CATEGORY_META, type Post, type PostCategory } from "../data/posts";
import { postPath } from "../utils/posts";
import {
  partitionIntoGalaxies,
  findGalaxyOf,
  type Galaxy,
} from "../utils/galaxies";

// Post metadata comes from the Markdown content collection via index.astro.
const props = defineProps<{ posts: Post[] }>();

// `?demo=N` appends N synthetic posts (client-side only) so the multi-galaxy
// group view and its transitions can be exercised before the real archive
// grows past one volume. Demo posts have no bodies — they only fill galaxies.
function makeDemoPosts(): Post[] {
  if (typeof window === "undefined") return [];
  const raw = new URLSearchParams(window.location.search).get("demo");
  if (raw === null) return [];
  const count = Math.min(400, Math.max(1, Number(raw) || 90));
  const categories = Object.keys(CATEGORY_META) as PostCategory[];
  return Array.from({ length: count }, (_, i) => ({
    slug: `demo-${i + 1}`,
    title: `演示文章 ${i + 1}`,
    date: `${2019 + Math.floor(i / 18)}.${String((i % 12) + 1).padStart(2, "0")}`,
    category: categories[i % categories.length],
    tags: ["demo"],
    summary: "?demo 模式的假資料，用來測試多星系視角。",
  }));
}

const allPosts: Post[] = [...props.posts, ...makeDemoPosts()];

// Semantic zoom: posts are chunked into galaxies of at most 40 stars each.
// Zooming far enough out swaps the black-hole scene for the "galaxy group"
// view, where every volume is a clickable impostor.
const galaxies = partitionIntoGalaxies(allPosts);
const activeGalaxy = ref<Galaxy>(
  galaxies[galaxies.length - 1] ?? {
    id: "galaxy-1",
    index: 1,
    name: "第 1 星系",
    era: "—",
    posts: [],
  },
);

// Which world the camera lives in; `to*` are the hyperspace-dip transitions.
// Mirrored into the template for the breadcrumb and hints.
const viewMode = ref<"galaxy" | "group" | "toGroup" | "toGalaxy">("galaxy");
const hoveredGalaxy = ref<Galaxy | null>(null);

// Overscroll-to-exit gesture: reaching the zoom wall shows a pill; wheeling
// further charges `exitProgress` toward 1 before the group view launches, so
// simply zooming out for an overview can never accidentally leave the galaxy.
const nearExitWall = ref(false);
const exitProgress = ref(0);

// "?" corner button -> controls guide panel.
const showInfo = ref(false);
const infoPanelEl = ref<HTMLElement | null>(null);
watch(showInfo, async (open) => {
  if (open) {
    await nextTick();
    infoPanelEl.value?.focus();
  }
});

const container = ref<HTMLDivElement | null>(null);

// --- UI state (bound by the template) ------------------------------------
// The post currently under the cursor, and where to float its tooltip.
const hoveredPost = ref<Post | null>(null);
const hoverStyle = ref<{ left: string; top: string } | null>(null);
// The post whose reading panel is open (null = exploring), plus its
// server-rendered Markdown body (read from the hidden node by slug).
const selectedPost = ref<Post | null>(null);
const selectedHtml = ref("");
const panelEl = ref<HTMLElement | null>(null);

// Legend filter: empty set = show every category.
const activeCategories = ref<Set<PostCategory>>(new Set());

// Sidebar search: the query filters the article list in place. Matches span
// every galaxy; picking one flies the camera there (switching volumes first
// when needed) and opens the article on arrival.
const searchQuery = ref("");
const searching = computed(() => searchQuery.value.trim().length > 0);
const filteredPosts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return allPosts;
  return allPosts.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      catLabel(p.category).toLowerCase().includes(q),
  );
});

// Sidebar article list: a plain, blog-style index of every post. Open/closed
// state is remembered across visits; hovering an entry highlights its star.
const showList = ref(false);
const LIST_KEY = "universe-list-open";
const listVisible = computed(
  () => showList.value && !selectedPost.value && viewMode.value === "galaxy",
);
function toggleList() {
  showList.value = !showList.value;
  try {
    localStorage.setItem(LIST_KEY, showList.value ? "1" : "0");
  } catch {
    /* private mode: the list just won't remember */
  }
}

// First-visit hint, shown once then remembered in localStorage.
const showHint = ref(false);
const HINT_KEY = "universe-hint-seen";

// Bridges into the three.js world, assigned once the scene exists.
let flyToStar: (slug: string) => void = () => {};
let flyToPostAndOpen: (post: Post) => void = () => {};
let applyFilter: (categories: Set<PostCategory>) => void = () => {};
let requestGroupView: () => void = () => {};
let highlightStar: (slug: string | null) => void = () => {};

// Sidebar hover/focus -> glow up the matching star in the scene. Stars from
// other galaxies simply aren't found, so the highlight is a no-op for them.
function hoverListPost(slug: string | null) {
  highlightStar(slug);
}
// Picking an entry keeps the universe feel: the camera flies to the star
// (diving across galaxies when needed) and the article opens on arrival.
function openFromList(post: Post) {
  highlightStar(null);
  flyToPostAndOpen(post);
}
function onSearchEnter() {
  const first = searching.value ? filteredPosts.value[0] : undefined;
  if (first) openFromList(first);
}
// The panel can disappear out from under the cursor (opening a post, leaving
// the galaxy view), so mouseleave alone can't be trusted to clean up.
watch(listVisible, (visible) => {
  if (!visible) highlightStar(null);
});

// Breadcrumb "星系群" crumb: zoom out to the group view.
function openGroupView() {
  requestGroupView();
}

// Category legend entries for the corner key.
const legend = (Object.keys(CATEGORY_META) as PostCategory[]).map((c) => ({
  category: c,
  label: CATEGORY_META[c].label,
  color: catColor(c),
}));

function catColor(category: PostCategory): string {
  return "#" + CATEGORY_META[category].color.toString(16).padStart(6, "0");
}
function catLabel(category: PostCategory): string {
  return CATEGORY_META[category].label;
}

// --- Deep links: modal state lives in the URL ------------------------------
// Opening a star pushState()s to the post's real /posts/[slug]/ page, so the
// address bar is always shareable; reload lands on the static article page,
// and Back/Forward open and close the modal via popstate.
function openPost(post: Post, pushHistory = true) {
  selectedHtml.value =
    document.getElementById(`post-body-${post.slug}`)?.innerHTML ?? "";
  selectedPost.value = post;
  if (pushHistory) {
    history.pushState({ universe: post.slug }, "", postPath(post.slug));
  }
}
function closeModal() {
  if (history.state?.universe) {
    // We pushed this entry: going back restores the index URL and the
    // popstate handler clears the modal, keeping history clean.
    history.back();
  } else {
    selectedPost.value = null;
  }
}
function handlePopstate(event: PopStateEvent) {
  const slug = event.state?.universe as string | undefined;
  const post = slug ? allPosts.find((p) => p.slug === slug) : undefined;
  if (post) {
    openPost(post, false);
  } else {
    selectedPost.value = null;
  }
}

function toggleCategory(category: PostCategory) {
  const next = new Set(activeCategories.value);
  if (next.has(category)) {
    next.delete(category);
  } else {
    next.add(category);
  }
  activeCategories.value = next;
  applyFilter(next);
}

// --- Modal accessibility: focus management + trap + Esc --------------------
let lastFocused: HTMLElement | null = null;
watch(selectedPost, async (post) => {
  if (post) {
    lastFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    await nextTick();
    panelEl.value?.focus();
  } else if (lastFocused) {
    lastFocused.focus();
    lastFocused = null;
  }
});

function handlePanelKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeModal();
    return;
  }
  if (event.key !== "Tab" || !panelEl.value) return;
  const focusables = panelEl.value.querySelectorAll<HTMLElement>(
    'button, a[href], [tabindex]:not([tabindex="-1"])',
  );
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || active === panelEl.value)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

onMounted(() => {
  const el = container.value;
  if (!el) return;

  window.addEventListener("popstate", handlePopstate);

  // Restore the sidebar's remembered open/closed state.
  try {
    showList.value = localStorage.getItem(LIST_KEY) === "1";
  } catch {
    /* private mode: default to closed */
  }

  // First-visit hint: fade in once, dismissed by time or first interaction.
  let hintTimer = 0;
  try {
    if (!localStorage.getItem(HINT_KEY)) {
      showHint.value = true;
      localStorage.setItem(HINT_KEY, "1");
      hintTimer = window.setTimeout(() => (showHint.value = false), 7000);
    }
  } catch {
    /* private mode: just skip the hint persistence */
  }

  // Low-power heuristic (small screens / touch): fewer particles and a lower
  // pixel-ratio cap keep phones cool; inertia off avoids fighting touch drags.
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const smallScreen = window.matchMedia("(max-width: 768px)").matches;
  const lowPower = coarsePointer || smallScreen;

  // Respect prefers-reduced-motion (live, in case the OS setting changes):
  // orbital/drift animation stops and bloom is dialed down, but the scene
  // still renders and stars stay hoverable/clickable.
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = reducedQuery.matches;
  const handleReducedChange = (e: MediaQueryListEvent) => {
    reducedMotion = e.matches;
  };
  reducedQuery.addEventListener("change", handleReducedChange);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    55,
    el.clientWidth / el.clientHeight,
    0.1,
    500,
  );
  camera.position.set(0, 5.5, 16);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2));
  renderer.setSize(el.clientWidth, el.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // Calm baseline: exposure pulled below 1 so the scene reads as a quiet,
  // deep-space backdrop that content can sit on top of, rather than a bright
  // showpiece competing with the article for attention.
  renderer.toneMappingExposure = 0.78;
  el.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableDamping = !coarsePointer;
  controls.dampingFactor = 0.08;
  controls.minDistance = 4.5;
  controls.maxDistance = 50;
  // Keep the camera above the gravity-well grid so users can freely orbit
  // 360° around the black hole without flipping underneath the "floor".
  controls.minPolarAngle = THREE.MathUtils.degToRad(15);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(85);
  const starfield = createStarfield(lowPower ? 1800 : 4000);
  const nebula = createNebula();
  const gravityGrid = createGravityGrid();
  const accretionDisk = createAccretionDisk({ count: lowPower ? 3000 : 7000 });
  const orbitingBodies = createOrbitingBodies();
  const jets = createJets({ countPerJet: lowPower ? 500 : 1200 });
  const dysonSphere = createDysonSphere();
  const einsteinRing = createEinsteinRing();
  const tidalDebris = createTidalDebris();

  // Everything belonging to a single galaxy lives in this group so the view
  // transition can shrink/hide it as one unit; the starfield and nebula are
  // the shared backdrop across both views.
  const galaxyScene = new THREE.Group();
  galaxyScene.add(
    gravityGrid.lines,
    accretionDisk.points,
    orbitingBodies.group,
    jets.points,
    dysonSphere.group,
    einsteinRing,
    tidalDebris,
  );

  let contentStars = createContentStars(activeGalaxy.value.posts);
  galaxyScene.add(contentStars.group);

  const impostors = createGalaxyImpostors(galaxies);
  impostors.setActive(activeGalaxy.value.id);
  impostors.group.visible = false;

  scene.add(starfield, nebula, galaxyScene, impostors.group);

  applyFilter = (categories) =>
    contentStars.setFilter(categories.size > 0 ? categories : null);

  // Sidebar hover: mark the star so the frame loop swells its glow and slows
  // its orbit, exactly like a direct in-scene hover.
  highlightStar = (slug) => {
    contentStars.highlighted = slug ? contentStars.findBySlug(slug) : null;
  };

  // Swap the interactive stars over to another volume's posts. The rest of
  // the black-hole scene is galaxy-agnostic, so only the stars are rebuilt.
  function activateGalaxy(galaxy: Galaxy) {
    if (galaxy.id === activeGalaxy.value.id) return;
    flight = null;
    contentStars.focused = null;
    contentStars.hovered = null;
    contentStars.highlighted = null;
    galaxyScene.remove(contentStars.group);
    contentStars.dispose();
    contentStars = createContentStars(galaxy.posts);
    contentStars.setFilter(
      activeCategories.value.size > 0 ? activeCategories.value : null,
    );
    galaxyScene.add(contentStars.group);
    activeGalaxy.value = galaxy;
    impostors.setActive(galaxy.id);
  }

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const lensingPass = new ShaderPass(LensingShader);
  lensingPass.uniforms.uAspect.value = el.clientWidth / el.clientHeight;
  composer.addPass(lensingPass);

  // Softer bloom with a higher threshold: only the brightest cores (photon
  // ring, star centers) glow, instead of the whole field smearing into haze.
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(el.clientWidth, el.clientHeight),
    0.6,
    0.6,
    0.3,
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  // --- Reading mode -------------------------------------------------------
  // When an article opens, the scene eases into a dimmer, slower, more
  // transparent state so the backdrop stops competing with the content, then
  // eases back on close. Any content/modal code toggles it without coupling
  // to this component:
  //   window.dispatchEvent(new CustomEvent("blackhole:reading", { detail: true }))
  //   window.dispatchEvent(new CustomEvent("blackhole:reading", { detail: false }))
  const EXPLORE_STATE = { exposure: 0.78, bloom: 0.6, opacity: 1, speed: 1 };
  const READING_STATE = { exposure: 0.34, bloom: 0.3, opacity: 0.4, speed: 0.35 };

  // Every particle material that exposes uOpacity, gathered once so the frame
  // loop can fade the whole field together.
  const spriteMaterials: THREE.ShaderMaterial[] = [];
  scene.traverse((obj) => {
    const material = (obj as THREE.Points).material;
    if (material instanceof THREE.ShaderMaterial && material.uniforms.uOpacity) {
      spriteMaterials.push(material);
    }
  });

  let readingTarget = 0; // 0 = explore, 1 = reading
  let readingMix = 0; // eased value that actually drives the scene
  function handleReading(event: Event) {
    readingTarget = (event as CustomEvent<boolean>).detail ? 1 : 0;
  }
  window.addEventListener("blackhole:reading", handleReading as EventListener);

  // Opening a post drives reading mode (via the same decoupled event) and
  // freezes camera rotation so the backdrop holds still while reading.
  watch(selectedPost, (post) => {
    window.dispatchEvent(
      new CustomEvent("blackhole:reading", { detail: post !== null }),
    );
    controls.enabled = post === null && !transition;
  });

  // --- Semantic zoom: galaxy <-> galaxy group ------------------------------
  // Leaving a galaxy is a deliberate gesture: the camera first hard-stops at
  // its zoom wall (GALAXY_DIST.max), then wheeling further charges the exit
  // before the group view launches. Zooming in past TO_GALAXY_AT (or clicking
  // an impostor) dives back in. Each switch is a short "hyperspace dip":
  // exposure sinks to near-black at the midpoint, where the two worlds swap
  // visibility — no cross-view LOD needed. The camera always lands far from
  // the opposite trigger, which is the hysteresis that keeps the boundary
  // from flickering.
  const GALAXY_CAM = new THREE.Vector3(0, 5.5, 16);
  const GROUP_CAM = new THREE.Vector3(0, 20, 52);
  const GALAXY_DIST = { min: 4.5, max: 50 };
  const GROUP_DIST = { min: 16, max: 70 };
  const TO_GALAXY_AT = 20;
  const EXIT_WALL = GALAXY_DIST.max - 2; // "at the wall" once past this

  const easeIn = (x: number) => x * x * x;
  const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

  let transition: {
    from: "group" | "galaxy";
    to: "group" | "galaxy";
    t: number;
    camFrom: THREE.Vector3;
    camMid: THREE.Vector3;
    camReFrom: THREE.Vector3;
    camTo: THREE.Vector3;
    swapped: boolean;
    targetGalaxy: Galaxy | null;
  } | null = null;
  // Search hit living in another galaxy: focus it once the dive-in lands.
  let pendingFocusSlug: string | null = null;
  // Sidebar pick: open this post's reading panel when its flight arrives.
  // Grabbing the scene or leaving for the group view cancels it with the
  // flight, so an interrupted flight never pops a panel later.
  let openOnArrival: Post | null = null;
  // Overscroll accumulator behind the `exitProgress` ref (0 -> 1 launches).
  let exitCharge = 0;
  // Exiting takes TWO gestures: the scroll that hits the wall never counts —
  // no matter how long it lasts — the wheel must first go quiet at the wall
  // (arming the gesture), and only the next scroll charges the exit. This is
  // what makes "zoom out for an overview" impossible to overshoot.
  let exitArmed = false;
  // Seconds since the last wheel-out event over the scene.
  let wheelIdle = Infinity;

  function startToGroup() {
    if (viewMode.value !== "galaxy" || selectedPost.value) return;
    viewMode.value = "toGroup";
    controls.enabled = false;
    exitCharge = 0;
    exitProgress.value = 0;
    exitArmed = false;
    nearExitWall.value = false;
    // Hand the camera over from any in-progress search flight.
    flight = null;
    openOnArrival = null;
    contentStars.focused = null;
    impostors.setOpacity(0);
    transition = {
      from: "galaxy",
      to: "group",
      t: 0,
      camFrom: camera.position.clone(),
      // Keep pulling back along the current view ray...
      camMid: camera.position.clone().normalize().multiplyScalar(64),
      // ...then settle onto the group overview from slightly beyond it.
      camReFrom: GROUP_CAM.clone().multiplyScalar(1.2),
      camTo: GROUP_CAM.clone(),
      swapped: false,
      targetGalaxy: null,
    };
  }

  // Dive into a galaxy: from the group view (clicking an impostor, zooming
  // in) or straight from another galaxy (cross-galaxy search), which warps
  // directly through one dip instead of chaining two via the group view.
  function startToGalaxy(galaxy: Galaxy) {
    const from = viewMode.value;
    if ((from !== "group" && from !== "galaxy") || selectedPost.value) return;
    viewMode.value = "toGalaxy";
    controls.enabled = false;
    flight = null;
    contentStars.focused = null;
    hoveredGalaxy.value = null;
    impostors.hovered = null;
    const anchor =
      impostors.findById(galaxy.id)?.anchor.position ?? new THREE.Vector3();
    transition = {
      from,
      to: "galaxy",
      t: 0,
      camFrom: camera.position.clone(),
      // From the group: dive most of the way toward the chosen impostor.
      // From a galaxy: pull back along the view ray into the dip instead.
      camMid:
        from === "group"
          ? camera.position.clone().lerp(anchor, 0.75)
          : camera.position
              .clone()
              .normalize()
              .multiplyScalar(Math.max(camera.position.length() * 1.8, 34)),
      // Come out of the dip already inside the galaxy, easing to rest.
      camReFrom: GALAXY_CAM.clone().multiplyScalar(1.7),
      camTo: GALAXY_CAM.clone(),
      swapped: false,
      targetGalaxy: galaxy,
    };
  }
  requestGroupView = startToGroup;

  // Midpoint of the dip: the screen is near-black, swap worlds.
  function swapWorlds(to: "group" | "galaxy", targetGalaxy: Galaxy | null) {
    const inGalaxy = to === "galaxy";
    if (inGalaxy && targetGalaxy) activateGalaxy(targetGalaxy);
    galaxyScene.visible = inGalaxy;
    galaxyScene.scale.setScalar(1);
    impostors.group.visible = !inGalaxy;
    lensingPass.enabled = inGalaxy;
    controls.minDistance = inGalaxy ? GALAXY_DIST.min : GROUP_DIST.min;
    controls.maxDistance = inGalaxy ? GALAXY_DIST.max : GROUP_DIST.max;
  }

  // --- Search fly-to --------------------------------------------------------
  // Picking a search result pins the star (paused + highlighted) and eases the
  // camera along the origin->star ray to just beyond it, so the star ends up
  // centered with the black hole behind. Polar angle is clamped to the
  // controls' limits so OrbitControls never fights the flight.
  let flight: { from: THREE.Vector3; t: number; star: ReturnType<typeof contentStars.findBySlug> } | null = null;
  const flightDest = new THREE.Vector3();
  const flightSpherical = new THREE.Spherical();
  flyToStar = (slug) => {
    // The star may live in another volume: switch galaxies first if needed.
    // From the group view, dive into the right galaxy and focus on arrival.
    if (viewMode.value === "group") {
      pendingFocusSlug = slug;
      startToGalaxy(findGalaxyOf(galaxies, slug) ?? activeGalaxy.value);
      return;
    }
    if (viewMode.value !== "galaxy") return; // mid-transition: ignore
    const home = findGalaxyOf(galaxies, slug);
    if (home && home.id !== activeGalaxy.value.id) {
      // Cross-galaxy hit: warp through the dip (never an unmasked swap) and
      // focus the star once the dive lands.
      pendingFocusSlug = slug;
      startToGalaxy(home);
      return;
    }
    const star = contentStars.findBySlug(slug);
    if (!star) return;
    contentStars.focused = star;
    flight = { from: camera.position.clone(), t: 0, star };
  };

  // Sidebar click: same flight as a search pick, plus the reading panel on
  // arrival. If flyToStar bailed (mid-transition, unknown slug) there is
  // nothing in progress, so drop the pending open instead of leaking it.
  flyToPostAndOpen = (post) => {
    openOnArrival = post;
    flyToStar(post.slug);
    if (!flight && !pendingFocusSlug) openOnArrival = null;
  };

  // --- Content-star picking ----------------------------------------------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(-2, -2); // offscreen until first move
  const downAt = { x: 0, y: 0 };
  const projected = new THREE.Vector3();

  function setPointer(event: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  function handlePointerMove(event: PointerEvent) {
    setPointer(event);
  }
  function handlePointerDown(event: PointerEvent) {
    downAt.x = event.clientX;
    downAt.y = event.clientY;
    // Grabbing the scene dismisses the hint and hands control back from any
    // in-progress search flight.
    showHint.value = false;
    flight = null;
    openOnArrival = null;
    contentStars.focused = null;
  }
  function handlePointerUp(event: PointerEvent) {
    // Distinguish a click from an orbit-drag: only treat near-stationary
    // releases as selections so dragging the camera never opens a post.
    const moved = Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y);
    if (moved > 6) return;
    setPointer(event);
    raycaster.setFromCamera(pointer, camera);
    if (viewMode.value === "galaxy") {
      const hit = raycaster.intersectObjects(contentStars.pickables, false)[0];
      if (hit) openPost(hit.object.userData.post as Post);
    } else if (viewMode.value === "group") {
      const hit = raycaster.intersectObjects(impostors.pickables, false)[0];
      if (hit) startToGalaxy(hit.object.userData.galaxy as Galaxy);
    }
  }
  // Overscroll-to-exit: once the camera sits at the zoom wall, further
  // wheel-out charges the exit gesture instead of instantly jumping views
  // (~5 notches, or the trackpad equivalent, to launch). Touch users take
  // the breadcrumb instead.
  function handleExitWheel(event: WheelEvent) {
    if (
      viewMode.value !== "galaxy" ||
      transition ||
      selectedPost.value ||
      galaxies.length < 2 ||
      event.deltaY <= 0
    ) {
      return;
    }
    // Every wheel-out is "activity": it keeps the gesture from arming, so a
    // single continuous scroll (or its momentum tail) can never launch.
    wheelIdle = 0;
    if (!exitArmed) return;
    // Normalize line-mode deltas (Firefox) and cap flick spikes so one
    // aggressive trackpad swipe can't launch on its own.
    const delta = event.deltaMode === 1 ? event.deltaY * 33 : event.deltaY;
    exitCharge = Math.min(1, exitCharge + Math.min(delta, 120) / 500);
    exitProgress.value = exitCharge;
    if (exitCharge >= 1) startToGroup();
  }

  renderer.domElement.addEventListener("pointermove", handlePointerMove);
  renderer.domElement.addEventListener("pointerdown", handlePointerDown);
  renderer.domElement.addEventListener("pointerup", handlePointerUp);
  renderer.domElement.addEventListener("wheel", handleExitWheel, {
    passive: true,
  });

  function handleResize() {
    const width = el!.clientWidth;
    const height = el!.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    bloomPass.setSize(width, height);
    lensingPass.uniforms.uAspect.value = width / height;
  }
  window.addEventListener("resize", handleResize);

  const clock = new THREE.Clock();
  let frameId = 0;
  let running = false;

  function animate() {
    if (!running) return;
    frameId = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1);

    // Ease toward the current reading target (~0.3s response), then drive the
    // scene's brightness, bloom, particle opacity and animation speed from it.
    readingMix += (readingTarget - readingMix) * Math.min(1, dt * 3.5);
    const mix = readingMix;
    renderer.toneMappingExposure = THREE.MathUtils.lerp(
      EXPLORE_STATE.exposure,
      READING_STATE.exposure,
      mix,
    );
    bloomPass.strength = THREE.MathUtils.lerp(
      // Reduced motion also means reduced glow: bloom is the single biggest
      // "shimmer" contributor, so it drops with the animation.
      reducedMotion ? 0.32 : EXPLORE_STATE.bloom,
      READING_STATE.bloom,
      mix,
    );
    const opacity = THREE.MathUtils.lerp(
      EXPLORE_STATE.opacity,
      READING_STATE.opacity,
      mix,
    );
    for (const material of spriteMaterials) {
      material.uniforms.uOpacity.value = opacity;
    }
    // Slow the motion in reading mode, stop it entirely under
    // prefers-reduced-motion; controls keep real time for input feel.
    const motion = reducedMotion
      ? 0
      : THREE.MathUtils.lerp(EXPLORE_STATE.speed, READING_STATE.speed, mix);
    const simDt = dt * motion;

    if (galaxyScene.visible) {
      accretionDisk.update(simDt, camera);
      gravityGrid.update(simDt);
      orbitingBodies.update(simDt);
      jets.update(simDt);
      dysonSphere.update(simDt);
      // Content stars get real dt for hover/filter easing, `motion` for orbits.
      contentStars.update(dt, motion);
    }
    if (impostors.group.visible) {
      impostors.update(dt, motion);
    }

    // --- View transition: the hyperspace dip --------------------------------
    if (transition) {
      const duration = reducedMotion ? 0.35 : 1.5;
      transition.t = Math.min(1, transition.t + dt / duration);
      const t = transition.t;

      if (!transition.swapped && t >= 0.5) {
        transition.swapped = true;
        swapWorlds(transition.to, transition.targetGalaxy);
        camera.position.copy(transition.camReFrom);
      }

      if (t < 0.5) {
        const k = easeIn(t / 0.5);
        camera.position.lerpVectors(transition.camFrom, transition.camMid, k);
        if (transition.from === "galaxy") {
          // The galaxy recedes into a dot as the camera pulls away.
          galaxyScene.scale.setScalar(1 - k * 0.55);
        } else {
          impostors.setOpacity(1 - k);
        }
      } else {
        const k = easeOut((t - 0.5) / 0.5);
        camera.position.lerpVectors(transition.camReFrom, transition.camTo, k);
        if (transition.to === "group") {
          impostors.setOpacity(k);
        } else {
          galaxyScene.scale.setScalar(0.45 + k * 0.55);
        }
      }

      // Exposure sinks to near-black at the swap and recovers after.
      renderer.toneMappingExposure *= 1 - 0.9 * Math.sin(Math.PI * t);

      if (t >= 1) {
        const arrived = transition.to;
        transition = null;
        viewMode.value = arrived;
        controls.enabled = !selectedPost.value;
        if (arrived === "galaxy" && pendingFocusSlug) {
          const slug = pendingFocusSlug;
          pendingFocusSlug = null;
          flyToStar(slug);
        }
      }
    } else if (!selectedPost.value) {
      // The camera always orbits the origin, so its length is the distance.
      const dist = camera.position.length();
      // Exit pill: armed while parked at the galaxy's zoom wall; the charge
      // drains away as soon as the wheel goes quiet or the camera leaves.
      const atWall =
        viewMode.value === "galaxy" &&
        galaxies.length > 1 &&
        dist >= EXIT_WALL;
      if (nearExitWall.value !== atWall) nearExitWall.value = atWall;
      wheelIdle += dt;
      if (!atWall) {
        exitArmed = false;
        exitCharge = 0;
      } else {
        // Arm once the wheel has gone quiet while parked at the wall; the
        // charge also drains during quiet stretches, so an armed-but-
        // abandoned gesture resets itself.
        if (!exitArmed && wheelIdle > 0.35) exitArmed = true;
        if (exitCharge > 0 && wheelIdle > 0.4) {
          exitCharge = Math.max(0, exitCharge - dt * 0.6);
        }
      }
      if (exitProgress.value !== exitCharge) exitProgress.value = exitCharge;

      if (viewMode.value === "group" && dist <= TO_GALAXY_AT) {
        startToGalaxy(activeGalaxy.value);
      }
    } else if (nearExitWall.value) {
      nearExitWall.value = false;
    }

    // Search flight: ease the camera toward the pinned star's viewpoint.
    if (flight?.star) {
      flight.t += reducedMotion ? 1 : dt / 1.3;
      const a = Math.min(1, flight.t);
      const k = a < 0.5 ? 4 * a * a * a : 1 - Math.pow(-2 * a + 2, 3) / 2;
      const starPos = flight.star.mesh.position;
      flightDest.copy(starPos).normalize().multiplyScalar(starPos.length() + 6.5);
      flightSpherical.setFromVector3(flightDest);
      flightSpherical.phi = THREE.MathUtils.clamp(
        flightSpherical.phi,
        controls.minPolarAngle,
        controls.maxPolarAngle,
      );
      flightDest.setFromSpherical(flightSpherical);
      camera.position.lerpVectors(flight.from, flightDest, k);
      if (a >= 1) {
        flight = null;
        if (openOnArrival) {
          const post = openOnArrival;
          openOnArrival = null;
          openPost(post);
        }
      }
    }

    // Hover picking: skip while a post is open (the panel covers the scene)
    // or while a view transition is flying the camera.
    if (selectedPost.value || transition) {
      contentStars.hovered = null;
      hoveredPost.value = null;
      impostors.hovered = null;
      hoveredGalaxy.value = null;
    } else if (viewMode.value === "group") {
      contentStars.hovered = null;
      hoveredPost.value = null;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(impostors.pickables, false)[0];
      const mesh = (hit?.object as THREE.Mesh) ?? null;
      impostors.hovered = mesh;
      renderer.domElement.style.cursor = mesh ? "pointer" : "default";
      if (mesh) {
        hoveredGalaxy.value = mesh.userData.galaxy as Galaxy;
        // Hitboxes sit inside positioned anchors: project the world position.
        projected.setFromMatrixPosition(mesh.matrixWorld).project(camera);
        const rect = renderer.domElement.getBoundingClientRect();
        hoverStyle.value = {
          left: `${rect.left + ((projected.x + 1) / 2) * rect.width}px`,
          top: `${rect.top + ((1 - projected.y) / 2) * rect.height}px`,
        };
      } else {
        hoveredGalaxy.value = null;
      }
    } else {
      impostors.hovered = null;
      hoveredGalaxy.value = null;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(contentStars.pickables, false)[0];
      const mesh = (hit?.object as THREE.Mesh) ?? null;
      contentStars.hovered = mesh;
      renderer.domElement.style.cursor = mesh ? "pointer" : "default";
      if (mesh) {
        hoveredPost.value = mesh.userData.post as Post;
        // Float the tooltip just above the star's projected screen position.
        projected.copy(mesh.position).project(camera);
        const rect = renderer.domElement.getBoundingClientRect();
        hoverStyle.value = {
          left: `${rect.left + ((projected.x + 1) / 2) * rect.width}px`,
          top: `${rect.top + ((1 - projected.y) / 2) * rect.height}px`,
        };
      } else {
        hoveredPost.value = null;
      }
    }

    // OrbitControls' update() re-clamps the camera to its distance limits,
    // which would fight the transition's own camera flight — skip it there.
    if (!transition) controls.update();

    // Feed the lensing pass how edge-on the disk is: 0 looking straight down
    // at it, 1 with the camera in its plane. Drives the fold-over arcs
    // (top/bottom) and disk lobes (left/right) in and the isotropic photon
    // ring out as the camera descends toward the disk.
    const edgeOn = 1 - Math.abs(camera.position.y) / camera.position.length();
    lensingPass.uniforms.uEdgeOn.value = THREE.MathUtils.smoothstep(
      edgeOn,
      0.15,
      0.75,
    );

    composer.render();
  }

  // Pause the whole render loop while the tab is hidden: no rAF, no GPU work.
  function start() {
    if (running) return;
    running = true;
    clock.getDelta(); // swallow the time spent hidden
    frameId = requestAnimationFrame(animate);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(frameId);
  }
  function handleVisibility() {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  }
  document.addEventListener("visibilitychange", handleVisibility);
  start();

  // Fade the static loading splash once the scene has actually painted a
  // frame (two rAFs after start = first frame is on screen), then drop it.
  const splash = document.getElementById("universe-loading");
  if (splash) {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        splash.classList.add("universe-loading--done");
        window.setTimeout(() => splash.remove(), 800);
      }),
    );
  }

  onBeforeUnmount(() => {
    stop();
    window.clearTimeout(hintTimer);
    window.removeEventListener("popstate", handlePopstate);
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("blackhole:reading", handleReading as EventListener);
    document.removeEventListener("visibilitychange", handleVisibility);
    reducedQuery.removeEventListener("change", handleReducedChange);
    renderer.domElement.removeEventListener("pointermove", handlePointerMove);
    renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
    renderer.domElement.removeEventListener("pointerup", handlePointerUp);
    renderer.domElement.removeEventListener("wheel", handleExitWheel);
    controls.dispose();
    composer.dispose();
    renderer.dispose();
    el.removeChild(renderer.domElement);

    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
        object.geometry.dispose();
        const material = object.material;
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose());
        } else {
          material.dispose();
        }
      } else if (object instanceof THREE.Sprite) {
        object.material.dispose();
      }
    });
  });
});
</script>

<template>
  <div class="universe">
    <div ref="container" class="black-hole-canvas"></div>

    <!-- Where am I: 星系群 › 星系 breadcrumb; the group crumb zooms out. -->
    <nav
      class="breadcrumb"
      :class="{ 'breadcrumb--hidden': selectedPost }"
      aria-label="宇宙層級"
    >
      <button
        type="button"
        class="breadcrumb__link"
        :disabled="viewMode !== 'galaxy'"
        @click="openGroupView"
      >
        星系群
      </button>
      <template v-if="viewMode === 'galaxy' || viewMode === 'toGalaxy'">
        <span class="breadcrumb__sep" aria-hidden="true">›</span>
        <span class="breadcrumb__current"
          >{{ activeGalaxy.name }} · {{ activeGalaxy.era }}</span
        >
      </template>
    </nav>

    <!-- Article list sidebar: a normal blog-style index for quick browsing.
         Hovering an entry highlights its star; clicking opens the post. -->
    <button
      type="button"
      class="list-toggle"
      :class="{
        'list-toggle--hidden': selectedPost || viewMode !== 'galaxy',
      }"
      :aria-expanded="showList"
      aria-controls="post-list-panel"
      @click="toggleList"
    >
      <span aria-hidden="true">☰</span> 文章清單
    </button>
    <Transition name="list-slide">
      <aside
        v-if="listVisible"
        id="post-list-panel"
        class="post-list"
        aria-label="文章清單"
      >
        <!-- Typing filters the list below in place; Enter picks the first
             match. Cross-galaxy matches are included — clicking one dives
             into its galaxy on the way to the star. -->
        <div class="post-list__search">
          <input
            v-model="searchQuery"
            class="post-list__search-input"
            type="search"
            placeholder="搜尋星系…"
            aria-label="搜尋文章"
            @keydown.enter.prevent="onSearchEnter"
            @keydown.escape="searchQuery = ''"
          />
        </div>
        <p class="post-list__count" role="status">
          <template v-if="searching"
            >符合 {{ filteredPosts.length }} / {{ allPosts.length }} 篇</template
          >
          <template v-else>共 {{ allPosts.length }} 篇</template>
        </p>
        <p v-if="!filteredPosts.length" class="post-list__empty">
          沒有符合的星星
        </p>
        <ul v-else class="post-list__items">
          <li v-for="post in filteredPosts" :key="post.slug">
            <button
              type="button"
              class="post-list__item"
              @mouseenter="hoverListPost(post.slug)"
              @mouseleave="hoverListPost(null)"
              @focus="hoverListPost(post.slug)"
              @blur="hoverListPost(null)"
              @click="openFromList(post)"
            >
              <span
                class="post-list__dot"
                :style="{ background: catColor(post.category) }"
              ></span>
              <span class="post-list__text">
                <span class="post-list__title">{{ post.title }}</span>
                <span class="post-list__meta">
                  {{ post.date
                  }}<template v-if="post.minutes">
                    · 約 {{ post.minutes }} 分鐘</template
                  >
                </span>
              </span>
            </button>
          </li>
        </ul>
      </aside>
    </Transition>

    <!-- Category legend: click a category to spotlight only its stars. -->
    <div
      class="legend"
      :class="{ 'legend--hidden': selectedPost || viewMode !== 'galaxy' }"
    >
      <button
        v-for="item in legend"
        :key="item.category"
        type="button"
        class="legend__item"
        :class="{
          'legend__item--muted':
            activeCategories.size > 0 && !activeCategories.has(item.category),
        }"
        :aria-pressed="activeCategories.has(item.category)"
        @click="toggleCategory(item.category)"
      >
        <span class="legend__dot" :style="{ background: item.color }"></span>
        {{ item.label }}
      </button>
    </div>

    <!-- First-visit hint: one quiet line, gone after a moment or a touch. -->
    <Transition name="hint-fade">
      <p v-if="showHint" class="hint" aria-hidden="true">
        拖曳探索宇宙 · 點擊星星閱讀文章
      </p>
    </Transition>

    <!-- Group view hint: how to get back into a galaxy. -->
    <Transition name="hint-fade">
      <p v-if="viewMode === 'group'" class="hint" aria-hidden="true">
        點擊星系進入 · 滾輪放大返回
      </p>
    </Transition>

    <!-- Exit pill: parked at the zoom wall — keep scrolling to leave. -->
    <Transition name="charge-fade">
      <div v-if="nearExitWall" class="exit-charge" aria-hidden="true">
        <span>繼續滾動 → 前往星系群</span>
        <span class="exit-charge__bar">
          <span
            class="exit-charge__fill"
            :style="{ width: exitProgress * 100 + '%' }"
          ></span>
        </span>
      </div>
    </Transition>

    <!-- Corner "?": opens the controls guide. -->
    <button
      v-if="!selectedPost"
      type="button"
      class="info-button"
      aria-label="操作指南"
      @click="showInfo = true"
    >
      ?
    </button>

    <!-- Controls guide panel. -->
    <Transition name="panel-fade">
      <div
        v-if="showInfo"
        class="reading-scrim info-scrim"
        @click.self="showInfo = false"
        @keydown.escape.prevent="showInfo = false"
      >
        <section
          ref="infoPanelEl"
          class="reading-panel info-panel"
          role="dialog"
          aria-modal="true"
          aria-label="操作指南"
          tabindex="-1"
        >
          <button
            class="reading-panel__close"
            aria-label="關閉操作指南"
            @click="showInfo = false"
          >
            ×
          </button>
          <h2 class="info-panel__title">操作指南</h2>
          <ul class="info-panel__list">
            <li><strong>拖曳</strong>旋轉視角，<strong>滾輪 / 雙指</strong>縮放</li>
            <li><strong>點擊星星</strong>閱讀文章，游標懸停可預覽</li>
            <li><strong>左下圖例</strong>篩選分類</li>
            <li>
              左上<strong>文章清單</strong>可瀏覽並<strong>搜尋</strong>全部文章，懸停點亮對應的星星，點擊即飛往該星並開啟文章
            </li>
            <li v-if="galaxies.length > 1">
              <strong>縮小到底後繼續滾動</strong>離開星系、綜覽星系群；點擊星系或滾輪放大即可返回
            </li>
            <li>左上<strong>星系群</strong>麵包屑隨時可切換視角</li>
          </ul>
        </section>
      </div>
    </Transition>

    <!-- Hover tooltip: minimal card floated above the focused star. -->
    <div
      v-if="hoveredPost && !selectedPost && hoverStyle"
      class="star-tooltip"
      :style="hoverStyle"
    >
      <div class="star-tooltip__title">{{ hoveredPost.title }}</div>
      <div class="star-tooltip__date">
        {{ hoveredPost.date
        }}<template v-if="hoveredPost.minutes">
          · 約 {{ hoveredPost.minutes }} 分鐘</template
        >
      </div>
      <div class="star-tooltip__tags">
        <span
          v-for="tag in hoveredPost.tags"
          :key="tag"
          class="star-tooltip__tag"
          >{{ tag }}</span
        >
      </div>
    </div>

    <!-- Hover tooltip for a galaxy impostor in the group view. -->
    <div
      v-if="hoveredGalaxy && hoverStyle && viewMode === 'group'"
      class="star-tooltip"
      :style="hoverStyle"
    >
      <div class="star-tooltip__title">{{ hoveredGalaxy.name }}</div>
      <div class="star-tooltip__date">
        {{ hoveredGalaxy.era }} · {{ hoveredGalaxy.posts.length }} 篇文章
      </div>
    </div>

    <!-- Reading panel: glassmorphism card shown when a post is open. -->
    <Transition name="panel-fade">
      <div
        v-if="selectedPost"
        class="reading-scrim"
        @click.self="closeModal"
        @keydown="handlePanelKeydown"
      >
        <article
          ref="panelEl"
          class="reading-panel"
          role="dialog"
          aria-modal="true"
          :aria-label="selectedPost.title"
          tabindex="-1"
        >
          <button class="reading-panel__close" aria-label="關閉文章" @click="closeModal">
            ×
          </button>
          <div
            class="reading-panel__category"
            :style="{ color: catColor(selectedPost.category) }"
          >
            <span
              class="reading-panel__dot"
              :style="{ background: catColor(selectedPost.category) }"
            ></span>
            {{ catLabel(selectedPost.category) }}
          </div>
          <h2 class="reading-panel__title">{{ selectedPost.title }}</h2>
          <div class="reading-panel__meta">
            {{ selectedPost.date
            }}<template v-if="selectedPost.minutes">
              · 約 {{ selectedPost.minutes }} 分鐘</template
            >
            ·
            <a class="reading-panel__permalink" :href="postPath(selectedPost.slug)"
              >單篇頁面 ↗</a
            >
          </div>
          <div class="reading-panel__tags">
            <span
              v-for="tag in selectedPost.tags"
              :key="tag"
              class="reading-panel__tag"
              >{{ tag }}</span
            >
          </div>
          <p class="reading-panel__summary">{{ selectedPost.summary }}</p>
          <!-- Rendered Markdown from the content collection. -->
          <div class="reading-panel__body" v-html="selectedHtml"></div>
        </article>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.universe {
  position: fixed;
  inset: 0;
  font-family:
    ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

.black-hole-canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: #000;
  overflow: hidden;
}

.black-hole-canvas :deep(canvas) {
  display: block;
}

/* --- Breadcrumb: 星系群 › 星系 --------------------------------------------- */
.breadcrumb {
  position: fixed;
  top: clamp(14px, 3vw, 24px);
  left: clamp(16px, 3vw, 32px);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 12px;
  background: rgba(12, 16, 28, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #d7def5;
  font-size: 12px;
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}
.breadcrumb--hidden {
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
}
.breadcrumb__link {
  border: none;
  background: none;
  color: #8ab4ff;
  font: inherit;
  padding: 2px 6px;
  border-radius: 6px;
  cursor: pointer;
}
.breadcrumb__link:disabled {
  color: inherit;
  opacity: 0.75;
  cursor: default;
}
.breadcrumb__link:not(:disabled):hover,
.breadcrumb__link:not(:disabled):focus-visible {
  background: rgba(255, 255, 255, 0.08);
}
.breadcrumb__sep {
  opacity: 0.5;
}
.breadcrumb__current {
  opacity: 0.9;
}

/* Mobile: the list toggle owns the top-left corner; tuck the breadcrumb just
   above the legend instead so they never overlap. */
@media (max-width: 640px) {
  .breadcrumb {
    top: auto;
    bottom: clamp(58px, 14vw, 76px);
  }
}

/* --- Article list sidebar: a Dyson plate ----------------------------------
   The chamfered octagon + pale-blue wireframe echoes the Dyson plates
   orbiting the black hole (three/blackhole/dysonSphere.ts): a faint #88ccff
   fill behind a brighter #aaddff border. clip-path would cut away a real CSS
   border, so the outline is layered instead: the element clips to the
   octagon, ::before paints the line color edge-to-edge, and ::after paints
   the fill inset 1px with the same octagon — leaving a 1px lit rim. */
.list-toggle {
  position: fixed;
  top: calc(clamp(14px, 3vw, 24px) + 42px);
  left: clamp(16px, 3vw, 32px);
  z-index: 20;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border: none;
  background: none;
  isolation: isolate;
  clip-path: polygon(
    9px 0,
    calc(100% - 9px) 0,
    100% 9px,
    100% calc(100% - 9px),
    calc(100% - 9px) 100%,
    9px 100%,
    0 calc(100% - 9px),
    0 9px
  );
  color: #d7def5;
  font-size: 12px;
  cursor: pointer;
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}
.list-toggle::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -2;
  background: rgba(170, 221, 255, 0.4);
}
.list-toggle::after {
  content: "";
  position: absolute;
  inset: 1px;
  z-index: -1;
  background: rgba(12, 16, 28, 0.55);
  clip-path: polygon(
    9px 0,
    calc(100% - 9px) 0,
    100% 9px,
    100% calc(100% - 9px),
    calc(100% - 9px) 100%,
    9px 100%,
    0 calc(100% - 9px),
    0 9px
  );
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  transition: background 0.15s ease;
}
.list-toggle:hover::after,
.list-toggle:focus-visible::after {
  background: rgba(136, 204, 255, 0.18);
}
.list-toggle:focus-visible::before {
  background: rgba(170, 221, 255, 0.9);
}
.list-toggle--hidden {
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
}
.post-list {
  position: fixed;
  top: calc(clamp(14px, 3vw, 24px) + 84px);
  left: clamp(16px, 3vw, 32px);
  bottom: clamp(64px, 10vh, 96px);
  z-index: 20;
  display: flex;
  flex-direction: column;
  width: min(290px, calc(100vw - 32px));
  border: none;
  background: none;
  isolation: isolate;
  clip-path: polygon(
    18px 0,
    calc(100% - 18px) 0,
    100% 18px,
    100% calc(100% - 18px),
    calc(100% - 18px) 100%,
    18px 100%,
    0 calc(100% - 18px),
    0 18px
  );
  color: #eef2ff;
  overflow: hidden;
}
.post-list::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -2;
  background: rgba(170, 221, 255, 0.4);
}
.post-list::after {
  content: "";
  position: absolute;
  inset: 1px;
  z-index: -1;
  background: rgba(11, 17, 30, 0.72);
  clip-path: polygon(
    18px 0,
    calc(100% - 18px) 0,
    100% 18px,
    100% calc(100% - 18px),
    calc(100% - 18px) 100%,
    18px 100%,
    0 calc(100% - 18px),
    0 18px
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  /* The plates' faint additive fill, as a whisper of inner glow. */
  box-shadow: inset 0 0 30px rgba(136, 204, 255, 0.07);
}
.post-list__search {
  flex: none;
  position: relative;
  isolation: isolate;
  margin: 14px 14px 0;
  clip-path: polygon(
    7px 0,
    calc(100% - 7px) 0,
    100% 7px,
    100% calc(100% - 7px),
    calc(100% - 7px) 100%,
    7px 100%,
    0 calc(100% - 7px),
    0 7px
  );
}
.post-list__search::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -2;
  background: rgba(170, 221, 255, 0.35);
  transition: background 0.15s ease;
}
.post-list__search::after {
  content: "";
  position: absolute;
  inset: 1px;
  z-index: -1;
  background: rgba(9, 14, 25, 0.7);
  clip-path: polygon(
    7px 0,
    calc(100% - 7px) 0,
    100% 7px,
    100% calc(100% - 7px),
    calc(100% - 7px) 100%,
    7px 100%,
    0 calc(100% - 7px),
    0 7px
  );
}
.post-list__search:focus-within::before {
  background: rgba(138, 180, 255, 0.8);
}
.post-list__search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: none;
  background: none;
  color: #eef2ff;
  font-size: 13px;
  outline: none;
}
.post-list__search-input::placeholder {
  color: rgba(215, 222, 245, 0.55);
}
.post-list__count {
  flex: none;
  margin: 0;
  padding: 10px 16px 8px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #aab4d4;
}
.post-list__empty {
  margin: 0;
  padding: 4px 16px 14px;
  color: #aab4d4;
  font-size: 12px;
}
.post-list__items {
  flex: 1;
  margin: 0;
  /* Extra bottom room keeps the last entry clear of the chamfered corners. */
  padding: 0 10px 16px;
  list-style: none;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.post-list__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: 10px;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}
.post-list__item:hover,
.post-list__item:focus-visible {
  background: rgba(255, 255, 255, 0.08);
}
.post-list__dot {
  flex: none;
  width: 8px;
  height: 8px;
  margin-top: 5px;
  border-radius: 50%;
}
.post-list__text {
  min-width: 0;
}
.post-list__title {
  display: block;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
}
.post-list__meta {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  opacity: 0.6;
}
.list-slide-enter-active,
.list-slide-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}
.list-slide-enter-from,
.list-slide-leave-to {
  opacity: 0;
  transform: translateX(-14px);
}

/* Mobile: the breadcrumb lives at the bottom, so the toggle takes the top-left
   corner; the panel stops above the breadcrumb + legend stack. */
@media (max-width: 640px) {
  .list-toggle {
    top: clamp(14px, 3vw, 24px);
  }
  .post-list {
    top: calc(clamp(14px, 3vw, 24px) + 44px);
    bottom: calc(clamp(58px, 14vw, 76px) + 46px);
  }
}

/* --- Category legend ----------------------------------------------------- */
.legend {
  position: fixed;
  left: clamp(16px, 3vw, 32px);
  bottom: clamp(16px, 3vw, 28px);
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 12px;
  background: rgba(12, 16, 28, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #d7def5;
  font-size: 12px;
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}
.legend--hidden {
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
}
.legend__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: none;
  border-radius: 8px;
  background: none;
  color: inherit;
  font: inherit;
  opacity: 0.85;
  cursor: pointer;
  transition:
    opacity 0.25s ease,
    background 0.15s ease;
}
.legend__item:hover,
.legend__item:focus-visible {
  background: rgba(255, 255, 255, 0.08);
}
.legend__item[aria-pressed="true"] {
  background: rgba(255, 255, 255, 0.12);
  opacity: 1;
}
.legend__item--muted {
  opacity: 0.35;
}
.legend__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* --- First-visit hint ------------------------------------------------------ */
.hint {
  position: fixed;
  left: 50%;
  bottom: clamp(72px, 12vh, 120px);
  transform: translateX(-50%);
  z-index: 20;
  margin: 0;
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(12, 16, 28, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #d7def5;
  font-size: 13px;
  letter-spacing: 0.06em;
  pointer-events: none;
}
.hint-fade-enter-active {
  transition: opacity 1.2s ease 0.8s;
}
.hint-fade-leave-active {
  transition: opacity 0.8s ease;
}
.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
}

/* --- Exit pill: overscroll-to-exit progress -------------------------------- */
.exit-charge {
  position: fixed;
  left: 50%;
  bottom: clamp(72px, 12vh, 120px);
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  border-radius: 16px;
  background: rgba(12, 16, 28, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #d7def5;
  font-size: 13px;
  letter-spacing: 0.06em;
  pointer-events: none;
}
.exit-charge__bar {
  display: block;
  width: 150px;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  overflow: hidden;
}
.exit-charge__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #8ab4ff;
}
.charge-fade-enter-active,
.charge-fade-leave-active {
  transition: opacity 0.25s ease;
}
.charge-fade-enter-from,
.charge-fade-leave-to {
  opacity: 0;
}

/* --- "?" info button + controls guide ------------------------------------- */
.info-button {
  position: fixed;
  right: clamp(16px, 3vw, 28px);
  bottom: clamp(16px, 3vw, 28px);
  z-index: 20;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(12, 16, 28, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #d7def5;
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease;
}
.info-button:hover,
.info-button:focus-visible {
  background: rgba(255, 255, 255, 0.14);
}
/* Double selectors: these must beat the base .reading-scrim/.reading-panel
   rules, which are declared later in this file. */
.reading-scrim.info-scrim {
  justify-content: center;
  align-items: center;
}
.reading-panel.info-panel {
  width: min(400px, 92vw);
  max-height: 80vh;
}
.info-panel__title {
  margin: 4px 0 16px;
  font-size: 20px;
  font-weight: 700;
}
.info-panel__list {
  margin: 0;
  padding-left: 18px;
  font-size: 14px;
  line-height: 1.9;
  opacity: 0.9;
}
.info-panel__list li + li {
  margin-top: 6px;
}
.info-panel__list strong {
  color: #8ab4ff;
  font-weight: 600;
}

/* --- Hover tooltip: minimal, translucent, follows the star --------------- */
.star-tooltip {
  position: fixed;
  transform: translate(-50%, calc(-100% - 18px));
  pointer-events: none;
  padding: 8px 12px;
  min-width: 120px;
  border-radius: 10px;
  background: rgba(12, 16, 28, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #eef2ff;
  white-space: nowrap;
  z-index: 20;
}
.star-tooltip__title {
  font-size: 13px;
  font-weight: 600;
}
.star-tooltip__date {
  font-size: 11px;
  opacity: 0.6;
  margin-top: 2px;
}
.star-tooltip__tags {
  margin-top: 6px;
  display: flex;
  gap: 5px;
}
.star-tooltip__tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  opacity: 0.85;
}

/* --- Reading panel: glassmorphism ---------------------------------------- */
.reading-scrim {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: clamp(16px, 4vw, 48px);
}
.reading-panel {
  position: relative;
  width: min(440px, 92vw);
  max-height: 84vh;
  overflow-y: auto;
  padding: 32px 30px;
  border-radius: 20px;
  background: rgba(14, 18, 30, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25);
  color: #eef2ff;
}
.reading-panel:focus {
  outline: none;
}
.reading-panel__close {
  position: absolute;
  top: 14px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #cdd6f4;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease;
}
.reading-panel__close:hover,
.reading-panel__close:focus-visible {
  background: rgba(255, 255, 255, 0.14);
}
.reading-panel__category {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.reading-panel__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.reading-panel__title {
  margin: 12px 0 6px;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
}
.reading-panel__meta {
  font-size: 13px;
  opacity: 0.75;
}
.reading-panel__permalink {
  color: #8ab4ff;
  text-decoration: none;
}
.reading-panel__permalink:hover,
.reading-panel__permalink:focus-visible {
  text-decoration: underline;
}
.reading-panel__tags {
  margin: 16px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.reading-panel__tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.reading-panel__summary {
  margin: 8px 0 16px;
  font-size: 15px;
  line-height: 1.6;
  opacity: 0.92;
}
.reading-panel__body {
  font-size: 14px;
  line-height: 1.75;
  opacity: 0.78;
}
/* Rendered Markdown (v-html) is unscoped, so reach it with :deep(). */
.reading-panel__body :deep(p) {
  margin: 0 0 12px;
}
.reading-panel__body :deep(strong) {
  color: #fff;
  font-weight: 600;
}
.reading-panel__body :deep(ul),
.reading-panel__body :deep(ol) {
  margin: 0 0 12px;
  padding-left: 20px;
}
.reading-panel__body :deep(li) {
  margin: 4px 0;
}
.reading-panel__body :deep(blockquote) {
  margin: 12px 0;
  padding: 6px 14px;
  border-left: 2px solid rgba(255, 255, 255, 0.25);
  opacity: 0.8;
  font-style: italic;
}
.reading-panel__body :deep(a) {
  color: #8ab4ff;
}
.reading-panel__body :deep(code) {
  padding: 1px 5px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 13px;
}
.reading-panel__body :deep(pre) {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
}
.reading-panel__body :deep(pre code) {
  padding: 0;
  background: none;
  font-size: inherit;
}

/* Panel fade/slide transition (slow, per the calm-motion goal). */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.35s ease;
}
.panel-fade-enter-active .reading-panel,
.panel-fade-leave-active .reading-panel {
  transition:
    transform 0.35s ease,
    opacity 0.35s ease;
}
.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}
.panel-fade-enter-from .reading-panel,
.panel-fade-leave-to .reading-panel {
  transform: translateX(24px);
  opacity: 0;
}

/* Reduced motion: keep the UI transitions near-instant as well. */
@media (prefers-reduced-motion: reduce) {
  .panel-fade-enter-active,
  .panel-fade-leave-active,
  .panel-fade-enter-active .reading-panel,
  .panel-fade-leave-active .reading-panel,
  .hint-fade-enter-active,
  .hint-fade-leave-active,
  .list-slide-enter-active,
  .list-slide-leave-active,
  .legend,
  .list-toggle {
    transition-duration: 0.01s;
    transition-delay: 0s;
  }
}

/* Mobile: the reading panel becomes a full-screen sheet. */
@media (max-width: 640px) {
  .reading-scrim {
    padding: 0;
    align-items: stretch;
    justify-content: stretch;
  }
  .reading-panel {
    width: 100vw;
    max-height: none;
    height: 100dvh;
    border-radius: 0;
    border-left: none;
    border-right: none;
    box-sizing: border-box;
    padding: 28px 22px 40px;
    /* More opaque than the desktop card: full-screen text sits directly over
       the bright bloom ring, so readability wins over the glass effect. */
    background: rgba(10, 13, 22, 0.72);
  }
  .panel-fade-enter-from .reading-panel,
  .panel-fade-leave-to .reading-panel {
    transform: translateY(24px);
  }
}
</style>
