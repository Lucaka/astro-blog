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
import { CATEGORY_META, type Post, type PostCategory } from "../data/posts";
import { postPath } from "../utils/posts";

// Post metadata comes from the Markdown content collection via index.astro.
const props = defineProps<{ posts: Post[] }>();

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

// Search Galaxy: type a keyword, pick a result, the camera flies to its star.
const searchQuery = ref("");
const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return [];
  return props.posts
    .filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        catLabel(p.category).toLowerCase().includes(q),
    )
    .slice(0, 8);
});

// First-visit hint, shown once then remembered in localStorage.
const showHint = ref(false);
const HINT_KEY = "universe-hint-seen";

// Bridges into the three.js world, assigned once the scene exists.
let flyToStar: (slug: string) => void = () => {};
let applyFilter: (categories: Set<PostCategory>) => void = () => {};

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
  const post = slug ? props.posts.find((p) => p.slug === slug) : undefined;
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

function selectSearchResult(post: Post) {
  searchQuery.value = "";
  flyToStar(post.slug);
}
function onSearchEnter() {
  const first = searchResults.value[0];
  if (first) selectSearchResult(first);
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
  const contentStars = createContentStars(props.posts);

  scene.add(
    starfield,
    nebula,
    gravityGrid.lines,
    accretionDisk.points,
    orbitingBodies.group,
    jets.points,
    dysonSphere.group,
    einsteinRing,
    tidalDebris,
    contentStars.group,
  );

  applyFilter = (categories) =>
    contentStars.setFilter(categories.size > 0 ? categories : null);

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
    controls.enabled = post === null;
  });

  // --- Search fly-to --------------------------------------------------------
  // Picking a search result pins the star (paused + highlighted) and eases the
  // camera along the origin->star ray to just beyond it, so the star ends up
  // centered with the black hole behind. Polar angle is clamped to the
  // controls' limits so OrbitControls never fights the flight.
  let flight: { from: THREE.Vector3; t: number; star: ReturnType<typeof contentStars.findBySlug> } | null = null;
  const flightDest = new THREE.Vector3();
  const flightSpherical = new THREE.Spherical();
  flyToStar = (slug) => {
    const star = contentStars.findBySlug(slug);
    if (!star) return;
    contentStars.focused = star;
    flight = { from: camera.position.clone(), t: 0, star };
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
    contentStars.focused = null;
  }
  function handlePointerUp(event: PointerEvent) {
    // Distinguish a click from an orbit-drag: only treat near-stationary
    // releases as selections so dragging the camera never opens a post.
    const moved = Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y);
    if (moved > 6) return;
    setPointer(event);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(contentStars.pickables, false)[0];
    if (hit) openPost(hit.object.userData.post as Post);
  }
  renderer.domElement.addEventListener("pointermove", handlePointerMove);
  renderer.domElement.addEventListener("pointerdown", handlePointerDown);
  renderer.domElement.addEventListener("pointerup", handlePointerUp);

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

    accretionDisk.update(simDt, camera);
    gravityGrid.update(simDt);
    orbitingBodies.update(simDt);
    jets.update(simDt);
    dysonSphere.update(simDt);
    // Content stars get real dt for hover/filter easing, `motion` for orbits.
    contentStars.update(dt, motion);

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
      if (a >= 1) flight = null;
    }

    // Hover picking: skip while a post is open (the panel covers the scene).
    if (selectedPost.value) {
      contentStars.hovered = null;
      hoveredPost.value = null;
    } else {
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

    controls.update();

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

    <!-- Search Galaxy: keyword -> fly the camera to the matching star. -->
    <div class="search" :class="{ 'search--hidden': selectedPost }">
      <input
        v-model="searchQuery"
        class="search__input"
        type="search"
        placeholder="搜尋星系…"
        aria-label="搜尋文章"
        @keydown.enter.prevent="onSearchEnter"
        @keydown.escape="searchQuery = ''"
      />
      <!-- Plain list of buttons: no listbox role — these are ordinary
           focusable buttons, and a real listbox would require option children
           and arrow-key management. -->
      <ul v-if="searchResults.length" class="search__results">
        <li v-for="post in searchResults" :key="post.slug">
          <button
            type="button"
            class="search__result"
            @click="selectSearchResult(post)"
          >
            <span
              class="search__dot"
              :style="{ background: catColor(post.category) }"
            ></span>
            <span class="search__result-title">{{ post.title }}</span>
            <span class="search__result-date">{{ post.date }}</span>
          </button>
        </li>
      </ul>
      <p
        v-else-if="searchQuery.trim()"
        class="search__empty"
        role="status"
      >
        沒有符合的星星
      </p>
    </div>

    <!-- Category legend: click a category to spotlight only its stars. -->
    <div class="legend" :class="{ 'legend--hidden': selectedPost }">
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

/* --- Search Galaxy -------------------------------------------------------- */
.search {
  position: fixed;
  top: clamp(14px, 3vw, 24px);
  right: clamp(14px, 3vw, 28px);
  z-index: 20;
  width: min(260px, calc(100vw - 32px));
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}
.search--hidden {
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
}
.search__input {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 14px;
  border-radius: 12px;
  background: rgba(12, 16, 28, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #eef2ff;
  font-size: 13px;
  outline: none;
}
.search__input::placeholder {
  color: rgba(215, 222, 245, 0.55);
}
.search__input:focus {
  border-color: rgba(138, 180, 255, 0.6);
}
.search__results,
.search__empty {
  margin: 8px 0 0;
  padding: 6px;
  list-style: none;
  border-radius: 12px;
  background: rgba(12, 16, 28, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.search__empty {
  padding: 10px 12px;
  color: #aab4d4;
  font-size: 12px;
}
.search__result {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: none;
  color: #eef2ff;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.search__result:hover,
.search__result:focus-visible {
  background: rgba(255, 255, 255, 0.08);
}
.search__dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.search__result-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.search__result-date {
  flex: none;
  font-size: 11px;
  opacity: 0.55;
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
  .legend,
  .search {
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
