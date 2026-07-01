import * as THREE from "three";

/**
 * Horizontal wireframe grid beneath the black hole that dips into a funnel
 * near the center, the classic "spacetime curvature" diagram. The dip is
 * computed in the vertex shader so it costs nothing on the CPU per frame.
 */
export function createGravityGrid(options?: {
  size?: number;
  segments?: number;
  depth?: number;
  falloff?: number;
}): THREE.LineSegments {
  const size = options?.size ?? 20;
  const segments = options?.segments ?? 40;
  const depth = options?.depth ?? 4;
  const falloff = options?.falloff ?? 3.2;

  const radius = size / 2;
  const step = size / segments;
  const verts: number[] = [];

  // Horizontal lines only (z = const, x varies) — no diagonals
  for (let j = 0; j <= segments; j++) {
    const z = -radius + j * step;
    for (let i = 0; i < segments; i++) {
      verts.push(-radius + i * step, 0, z, -radius + (i + 1) * step, 0, z);
    }
  }

  // Vertical lines only (x = const, z varies)
  for (let i = 0; i <= segments; i++) {
    const x = -radius + i * step;
    for (let j = 0; j < segments; j++) {
      verts.push(x, 0, -radius + j * step, x, 0, -radius + (j + 1) * step);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uDepth: { value: depth },
      uFalloff: { value: falloff },
      uRadius: { value: radius },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0xb8d8f0) },
    },
    vertexShader: /* glsl */ `
      uniform float uDepth;
      uniform float uFalloff;
      uniform float uTime;
      varying float vDip;
      varying vec2 vXZ;

      void main() {
        float r = length(position.xz);
        vXZ = position.xz;

        // Static gravitational funnel
        float funnel = uDepth * exp(-r / uFalloff);

        // Outward-propagating gravity wave, decaying with distance
        float wave = 0.6 * sin(r * 2.0 - uTime * 2.5) * exp(-r * 0.2);

        float dip = funnel + wave;
        vDip = dip / uDepth;

        vec3 displaced = position + vec3(0.0, -dip, 0.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uRadius;
      varying float vDip;
      varying vec2 vXZ;

      void main() {
        if (length(vXZ) > uRadius) discard;
        float normR = length(vXZ) / uRadius;
        float alpha = 0.25 * (1.0 - normR * normR);
        float intensity = max(0.05, 0.12 + vDip * 0.5);
        gl_FragColor = vec4(uColor * intensity, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
  });

  const lines = new THREE.LineSegments(geometry, material);
  lines.position.y = -3.5;

  const startTime = performance.now();
  lines.onBeforeRender = () => {
    material.uniforms.uTime.value = (performance.now() - startTime) / 1000;
  };

  return lines;
}
