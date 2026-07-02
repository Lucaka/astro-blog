import type { IUniform } from "three";

/**
 * Screen-space black hole shadow with only a sliver of edge distortion - the
 * broad-area gravitational lensing warp has been removed entirely, so stars,
 * disk and grid render undistorted everywhere except a thin ring right at
 * the shadow boundary (r^10 falloff confines it there, tighter than a
 * gentler power would give). The sample point is pushed off-screen only
 * within that ring, which is what paints the shadow black without any
 * hard-edged cutout.
 *
 * A bright photon ring is composited on top, a razor-thin Gaussian glow
 * pinned to the same shadow radius so it always hugs the shadow edge no
 * matter how the camera orbits. Because this pass runs before the bloom
 * pass, the ring blooms into the signature halo of light seen around a real
 * black hole (EHT M87*, Interstellar's Gargantua).
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
    // Aspect-corrected screen radius where the lensing shadow terminates;
    // the photon ring is centered here so the two stay locked together.
    uShadowRadius: { value: 0.052 },
    uRingWidth: { value: 0.007 },
    uRingIntensity: { value: 1.1 },
    uRingColor: { value: [1.0, 0.86, 0.62] },
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
    uniform float uShadowRadius;
    uniform float uRingWidth;
    uniform float uRingIntensity;
    uniform vec3 uRingColor;
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

      // Base scene color: black inside the shadow (sample pushed off-screen),
      // otherwise the lensed scene behind.
      vec3 color;
      if (sampleUv.x < 0.0 || sampleUv.x > 1.0 || sampleUv.y < 0.0 || sampleUv.y > 1.0) {
        color = vec3(0.0);
      } else {
        color = texture2D(tDiffuse, sampleUv).rgb;
      }

      // Photon ring: thin Gaussian glow centered on the shadow radius. Added
      // on top of the (possibly black) base so it stays visible even where it
      // overlaps the shadow edge, and feeds the downstream bloom pass.
      float d = r - uShadowRadius;
      float ring = exp(-(d * d) / (2.0 * uRingWidth * uRingWidth));
      color += uRingColor * ring * uRingIntensity;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};
