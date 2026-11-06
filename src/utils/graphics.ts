/**
 * Graphics preferences for the universe scene. The loading gate and the
 * in-scene gear share this shape; it lives in localStorage so a return
 * visit can skip the gate and rebuild with the same preset.
 */

export type QualityId = "high" | "balanced" | "saver";

export interface GraphicsSettings {
  quality: QualityId;
  /** User override for bloom. Saver still starts with this off. */
  bloom: boolean;
  /** Drop DPR and bloom while the frame rate stays under 30. */
  autoLower: boolean;
  /**
   * Explicit reduced-motion choice. `null` means "follow the OS", which
   * always wins when the OS asks for less motion.
   */
  reducedMotion: boolean | null;
  /** The visitor has passed the loading gate at least once. */
  entered: boolean;
}

export interface QualityPreset {
  dpr: number;
  /** Bloom strength while the user has bloom enabled. 0 = preset prefers off. */
  bloom: number;
  stars: number;
  disk: number;
  jets: number;
  antialias: boolean;
}

export const QUALITY_PRESET: Record<QualityId, QualityPreset> = {
  high: {
    dpr: 2,
    bloom: 0.6,
    stars: 4000,
    disk: 7000,
    jets: 1200,
    antialias: true,
  },
  balanced: {
    dpr: 1.5,
    bloom: 0.45,
    stars: 2600,
    disk: 4500,
    jets: 800,
    antialias: true,
  },
  saver: {
    dpr: 1,
    bloom: 0,
    stars: 1400,
    disk: 2200,
    jets: 400,
    antialias: false,
  },
};

const KEY = "universe-graphics";
const IDS: QualityId[] = ["high", "balanced", "saver"];

function isQuality(value: unknown): value is QualityId {
  return typeof value === "string" && (IDS as string[]).includes(value);
}

/** Device/GPU-ish heuristic. Most phones land on saver; desktops on balanced. */
export function detectQuality(): QualityId {
  if (typeof window === "undefined") return "balanced";
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const saveData = nav.connection?.saveData === true;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 768px)").matches;
  if (saveData || memory <= 2 || cores <= 2 || (coarse && narrow))
    return "saver";
  if (!coarse && !narrow && memory >= 8 && cores >= 8) return "high";
  return "balanced";
}

export function defaultGraphics(): GraphicsSettings {
  const quality = detectQuality();
  return {
    quality,
    bloom: quality !== "saver",
    autoLower: true,
    reducedMotion: null,
    entered: false,
  };
}

export function loadGraphics(): GraphicsSettings {
  const base = defaultGraphics();
  if (typeof localStorage === "undefined") return base;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<GraphicsSettings>;
    return {
      quality: isQuality(parsed.quality) ? parsed.quality : base.quality,
      bloom: typeof parsed.bloom === "boolean" ? parsed.bloom : base.bloom,
      autoLower:
        typeof parsed.autoLower === "boolean"
          ? parsed.autoLower
          : base.autoLower,
      reducedMotion:
        typeof parsed.reducedMotion === "boolean" ? parsed.reducedMotion : null,
      entered: parsed.entered === true,
    };
  } catch {
    return base;
  }
}

export function saveGraphics(settings: GraphicsSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* private mode */
  }
}

/** Bloom strength for the current preset, or 0 when the user turned it off. */
export function bloomStrength(quality: QualityId, bloomOn: boolean): number {
  if (!bloomOn) return 0;
  const preset = QUALITY_PRESET[quality].bloom;
  return preset > 0 ? preset : 0.28;
}

export function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    return !!gl;
  } catch {
    return false;
  }
}
