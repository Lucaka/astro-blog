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
 * The glow composited on top recreates Interstellar's Gargantua, exploiting
 * the fact that the accretion disk lies in the world XZ-plane and the camera
 * orbits with up ~ +Y, so screen-horizontal always tracks the disk plane and
 * screen-vertical the spin axis:
 *
 *  - a fold-over halo: a thick ring of light hugging the entire shadow (the
 *    far side of the disk lensed around the hole), brightest over the poles
 *    where it folds across the "head" and "feet", with the top brighter
 *    still because the camera always sits above the disk plane;
 *  - an equatorial band: the disk's direct edge-on image, a horizontal
 *    blade of light crossing IN FRONT of the shadow and tapering into long
 *    glowing wings on both sides;
 *  - a faint isotropic photon ring underneath both.
 *
 * The halo and band only exist when the disk is seen edge-on, so they are
 * scaled by uEdgeOn (0 = top-down view, 1 = camera in the disk plane, fed
 * per-frame from the camera's polar angle) and the isotropic ring takes
 * back over as the camera climbs. Because this pass runs before the bloom
 * pass, the halo blooms into the glow domes above and below the hole and
 * the band into the signature horizontal blaze.
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
    uShadowRadius: { value: 0.05 },
    uRingWidth: { value: 0.007 },
    uRingIntensity: { value: 1.1 },
    // Orange-red palette after the EHT M87* imagery: deep ember red-orange
    // base; the band core pulls toward yellow-orange rather than white.
    uRingColor: { value: [1.0, 0.42, 0.12] },
    // Brightness of the equatorial disk band crossing in front of the
    // shadow, and of the fold-over halo hugging it; both fade with
    // uEdgeOn -> 0.
    uDiskIntensity: { value: 0.21 },
    uArcIntensity: { value: 0.19 },
    // 0 = camera straight above the disk, 1 = camera in the disk plane.
    uEdgeOn: { value: 0 },
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
    uniform float uDiskIntensity;
    uniform float uArcIntensity;
    uniform float uEdgeOn;
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

      // Glow around the shadow, added on top of the (possibly black) base so
      // it stays visible where it overlaps the shadow edge, and feeds the
      // downstream bloom pass. delta is already aspect-corrected, so these
      // are true screen-space direction cosines around the shadow.
      float d = r - uShadowRadius;
      float cosA = delta.x / max(r, 1e-4); // +/-1 at screen left/right
      float sinA = delta.y / max(r, 1e-4); // +/-1 at screen top/bottom

      // Faint isotropic photon ring: the always-there baseline glow.
      float ring = exp(-(d * d) / (2.0 * uRingWidth * uRingWidth));

      // Equatorial band: the disk's direct edge-on image. Its near side
      // passes between the camera and the hole, so the blade of light
      // crosses IN FRONT of the shadow (no radial mask) and tapers into
      // long wings over ~2 shadow radii on each side.
      float wBand = uRingWidth * 1.2;
      float band = exp(-(delta.y * delta.y) / (2.0 * wBand * wBand));
      band *= exp(-max(r - uShadowRadius, 0.0) / (uShadowRadius * 1.8));

      // Fold-over halo: the far side of the disk lensed around the whole
      // shadow into a thick ring of light hugging it. Bright everywhere,
      // strongest over the poles where the fold-over image stacks up, and
      // brighter on top because the camera always sits above the disk plane.
      float dHalo = r - uShadowRadius * 1.06;
      float wHalo = uRingWidth * 1.3;
      float halo = exp(-(dHalo * dHalo) / (2.0 * wHalo * wHalo));
      halo *= 0.55 + 0.45 * abs(sinA);
      halo *= mix(0.75, 1.0, smoothstep(-0.6, 0.6, sinA));

      // Fold-over band/halo only exist edge-on; from above, the isotropic
      // ring takes back over so the transition tracks the camera's orbit.
      float glow = ring * uRingIntensity * mix(1.0, 0.35, uEdgeOn)
        + (band * uDiskIntensity + halo * uArcIntensity) * uEdgeOn;
      // The blade of the band burns hotter than the ember halo: pull the
      // glow color toward yellow-orange where the band dominates.
      vec3 glowColor = mix(uRingColor, vec3(1.0, 0.78, 0.35), clamp(band * uEdgeOn, 0.0, 1.0) * 0.5);
      color += glowColor * glow;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};
