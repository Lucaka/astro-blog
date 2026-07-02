<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
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
function openPost(post: Post) {
  selectedHtml.value =
    document.getElementById(`post-body-${post.slug}`)?.innerHTML ?? "";
  selectedPost.value = post;
}
function closeModal() {
  selectedPost.value = null;
}

onMounted(() => {
  const el = container.value;
  if (!el) return;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    55,
    el.clientWidth / el.clientHeight,
    0.1,
    500,
  );
  camera.position.set(0, 5.5, 16);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 4.5;
  controls.maxDistance = 50;
  // Keep the camera above the gravity-well grid so users can freely orbit
  // 360° around the black hole without flipping underneath the "floor".
  controls.minPolarAngle = THREE.MathUtils.degToRad(15);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(85);
  const starfield = createStarfield();
  const nebula = createNebula();
  const gravityGrid = createGravityGrid();
  const accretionDisk = createAccretionDisk();
  const orbitingBodies = createOrbitingBodies();
  const jets = createJets();
  const dysonSphere = createDysonSphere();
  const einsteinRing = createEinsteinRing();
  const tidalDebris = createTidalDebris();
  const contentStars = createContentStars(props.posts);

  scene.add(
    starfield,
    nebula,
    gravityGrid,
    accretionDisk.points,
    orbitingBodies.group,
    jets.points,
    dysonSphere.group,
    einsteinRing,
    tidalDebris,
    contentStars.group,
  );

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

  function animate() {
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
      EXPLORE_STATE.bloom,
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
    // Slow the motion in reading mode; controls keep real time for input feel.
    const simDt =
      dt * THREE.MathUtils.lerp(EXPLORE_STATE.speed, READING_STATE.speed, mix);

    accretionDisk.update(simDt, camera);
    orbitingBodies.update(simDt);
    jets.update(simDt);
    dysonSphere.update(simDt);
    contentStars.update(simDt);

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
    composer.render();
  }
  animate();

  onBeforeUnmount(() => {
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("blackhole:reading", handleReading as EventListener);
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

    <!-- Category legend: minimal key, fades out while reading. -->
    <div class="legend" :class="{ 'legend--hidden': selectedPost }">
      <span v-for="item in legend" :key="item.category" class="legend__item">
        <span class="legend__dot" :style="{ background: item.color }"></span>
        {{ item.label }}
      </span>
    </div>

    <!-- Hover tooltip: minimal card floated above the focused star. -->
    <div
      v-if="hoveredPost && !selectedPost && hoverStyle"
      class="star-tooltip"
      :style="hoverStyle"
    >
      <div class="star-tooltip__title">{{ hoveredPost.title }}</div>
      <div class="star-tooltip__date">{{ hoveredPost.date }}</div>
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
      <div v-if="selectedPost" class="reading-scrim" @click.self="closeModal">
        <article class="reading-panel">
          <button class="reading-panel__close" aria-label="Close" @click="closeModal">
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
          <h1 class="reading-panel__title">{{ selectedPost.title }}</h1>
          <div class="reading-panel__meta">{{ selectedPost.date }}</div>
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

/* --- Category legend ----------------------------------------------------- */
.legend {
  position: fixed;
  left: clamp(16px, 3vw, 32px);
  bottom: clamp(16px, 3vw, 28px);
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding: 10px 14px;
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
  opacity: 0.85;
}
.legend__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
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
.reading-panel__close:hover {
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
  opacity: 0.6;
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
</style>
