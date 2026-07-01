import type { IUniform } from "three";

/**
 * Screen-space black hole shadow with only a sliver of edge distortion - the
 * broad-area gravitational lensing warp has been removed entirely, so stars,
 * disk and grid render undistorted everywhere except a thin ring right at
 * the shadow boundary (r^10 falloff confines it there, tighter than a
 * gentler power would give). The sample point is pushed off-screen only
 * within that ring, which is what paints the shadow black without any
 * hard-edged cutout.
 */
export const LensingShader: {
  uniforms: Record<string, IUniform>;
  vertexShader: string;
  fragmentShader: string;
} = {
  uniforms: {
    tDiffuse: { value: null },
    uAspect: { value: 1 },
    uCoreStrength: { value: 4.62e-12 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uAspect;
    uniform float uCoreStrength;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5, 0.5);
      vec2 delta = vUv - center;
      delta.x *= uAspect;

      float r = length(delta);

      vec2 offset = vec2(0.0);
      if (r > 0.0005) {
        float distortion = uCoreStrength / pow(r + 0.01, 9.0);
        offset = normalize(delta) * distortion;
      }

      vec2 sampleDelta = delta + offset;
      sampleDelta.x /= uAspect;
      vec2 sampleUv = center + sampleDelta;

      if (sampleUv.x < 0.0 || sampleUv.x > 1.0 || sampleUv.y < 0.0 || sampleUv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }

      gl_FragColor = texture2D(tDiffuse, sampleUv);
    }
  `,
};
