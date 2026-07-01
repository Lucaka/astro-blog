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
}): THREE.Mesh {
  const size = options?.size ?? 60;
  const segments = options?.segments ?? 90;
  const depth = options?.depth ?? 9;
  const falloff = options?.falloff ?? 3.2;

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uDepth: { value: depth },
      uFalloff: { value: falloff },
      uColor: { value: new THREE.Color(0x8fd0ff) },
    },
    vertexShader: /* glsl */ `
      uniform float uDepth;
      uniform float uFalloff;
      varying float vDip;

      void main() {
        float r = length(position.xz);
        float dip = uDepth * exp(-r / uFalloff);
        vec3 displaced = position + vec3(0.0, -dip, 0.0);
        vDip = dip / uDepth;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vDip;

      void main() {
        float intensity = 0.25 + vDip * 1.4;
        gl_FragColor = vec4(uColor * intensity, 0.6);
      }
    `,
    wireframe: true,
    transparent: true,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -0.4;
  return mesh;
}
