import type { IUniform } from "three";

/**
 * Screen-space fake gravitational lensing: pushes the sample point radially
 * outward from the (screen-center) black hole, growing sharply close in.
 * This bends whatever was rendered behind it - stars, disk, grid - without
 * any raymarching, and naturally crushes the very center to black once the
 * sample point is pushed off-screen, giving the "shadow" for free instead of
 * drawing a literal event-horizon sphere.
 */
export const LensingShader: {
  uniforms: Record<string, IUniform>;
  vertexShader: string;
  fragmentShader: string;
} = {
  uniforms: {
    tDiffuse: { value: null },
    uAspect: { value: 1 },
    uStrength: { value: 0.14 },
    uFalloff: { value: 0.14 },
    uShadowRadius: { value: 0.07 },
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
    uniform float uStrength;
    uniform float uFalloff;
    uniform float uShadowRadius;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5, 0.5);
      vec2 delta = vUv - center;
      delta.x *= uAspect;

      float r = length(delta);

      if (r < uShadowRadius) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }

      // Distortion peaks right at the shadow edge and decays smoothly with
      // distance, instead of blowing up like a true 1/r^2 falloff would in
      // normalized UV space.
      float t = r - uShadowRadius;
      float distortion = uStrength * exp(-t / uFalloff);
      vec2 offset = normalize(delta) * distortion;
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
