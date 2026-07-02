<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
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

const container = ref<HTMLDivElement | null>(null);

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
    accretionDisk.update(dt, camera);
    orbitingBodies.update(dt);
    jets.update(dt);
    dysonSphere.update(dt);
    controls.update();
    composer.render();
  }
  animate();

  onBeforeUnmount(() => {
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", handleResize);
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
      }
    });
  });
});
</script>

<template>
  <div ref="container" class="black-hole-canvas"></div>
</template>

<style scoped>
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
</style>
