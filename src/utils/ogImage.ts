/**
 * Per-post Open Graph cards: a dark sky, stars tinted with the post's
 * category color, and the title set in Noto Sans TC. Built at `astro build`
 * time (satori → resvg); nothing here runs in the browser.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { CATEGORY_META, type PostCategory } from "../data/posts";

const WIDTH = 1200;
const HEIGHT = 630;
const FONT_FAMILY = "Noto Sans TC";

type OgNode = {
  type: string;
  props: {
    style?: Record<string, string | number>;
    children?: string | OgNode | OgNode[];
  };
};

function el(
  type: string,
  style: Record<string, string | number>,
  children?: string | OgNode | OgNode[],
): OgNode {
  return { type, props: { style, children } };
}

function catHex(category: PostCategory): string {
  return "#" + CATEGORY_META[category].color.toString(16).padStart(6, "0");
}

/** Stable star field so a given category always paints the same sky. */
const STARS: { x: number; y: number; s: number; o: number }[] = [
  { x: 86, y: 54, s: 3, o: 0.9 },
  { x: 150, y: 120, s: 2, o: 0.55 },
  { x: 240, y: 70, s: 4, o: 0.8 },
  { x: 310, y: 160, s: 2, o: 0.45 },
  { x: 420, y: 48, s: 3, o: 0.7 },
  { x: 510, y: 130, s: 2, o: 0.4 },
  { x: 640, y: 64, s: 5, o: 0.85 },
  { x: 720, y: 150, s: 2, o: 0.5 },
  { x: 830, y: 40, s: 3, o: 0.75 },
  { x: 910, y: 110, s: 2, o: 0.45 },
  { x: 990, y: 56, s: 4, o: 0.9 },
  { x: 1080, y: 140, s: 3, o: 0.6 },
  { x: 1140, y: 48, s: 2, o: 0.5 },
  { x: 70, y: 240, s: 2, o: 0.35 },
  { x: 180, y: 300, s: 3, o: 0.4 },
  { x: 1040, y: 220, s: 3, o: 0.55 },
  { x: 1120, y: 280, s: 2, o: 0.4 },
  { x: 980, y: 340, s: 4, o: 0.35 },
  { x: 60, y: 480, s: 2, o: 0.3 },
  { x: 200, y: 540, s: 3, o: 0.45 },
  { x: 1088, y: 500, s: 3, o: 0.55 },
  { x: 1160, y: 560, s: 2, o: 0.4 },
];

let fontData:
  { name: string; data: ArrayBuffer; weight: 400; style: "normal" }[] | null =
  null;

async function loadFonts() {
  if (fontData) return fontData;
  const dir = join(process.cwd(), "src/assets/fonts");
  const [latin, cjk] = await Promise.all([
    readFile(join(dir, "NotoSansTC-Latin.woff")),
    readFile(join(dir, "NotoSansTC-Regular.woff")),
  ]);
  const asBuffer = (buf: Buffer): ArrayBuffer =>
    buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength,
    ) as ArrayBuffer;
  fontData = [
    { name: FONT_FAMILY, data: asBuffer(latin), weight: 400, style: "normal" },
    { name: FONT_FAMILY, data: asBuffer(cjk), weight: 400, style: "normal" },
  ];
  return fontData;
}

function titleSize(title: string): number {
  if (title.length > 42) return 42;
  if (title.length > 26) return 52;
  return 64;
}

export async function renderOgPng(input: {
  title: string;
  summary: string;
  category: PostCategory;
}): Promise<Buffer> {
  const color = catHex(input.category);
  const label = CATEGORY_META[input.category].label;
  const summary =
    input.summary.length > 90
      ? `${input.summary.slice(0, 89)}…`
      : input.summary;

  const stars = STARS.map((star) =>
    el("div", {
      position: "absolute",
      left: `${star.x}px`,
      top: `${star.y}px`,
      width: `${star.s}px`,
      height: `${star.s}px`,
      borderRadius: "999px",
      backgroundColor: color,
      opacity: star.o,
    }),
  );

  const tree = el(
    "div",
    {
      width: `${WIDTH}px`,
      height: `${HEIGHT}px`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      backgroundColor: "#05070f",
      backgroundImage: `radial-gradient(circle at 80% 0%, ${color}33, transparent 42%)`,
      padding: "68px 72px",
      position: "relative",
      fontFamily: FONT_FAMILY,
    },
    [
      el(
        "div",
        {
          position: "absolute",
          top: "0px",
          left: "0px",
          width: `${WIDTH}px`,
          height: `${HEIGHT}px`,
          display: "flex",
        },
        stars,
      ),
      el("div", { display: "flex", alignItems: "center", gap: "14px" }, [
        el("div", {
          width: "14px",
          height: "14px",
          borderRadius: "999px",
          backgroundColor: color,
        }),
        el(
          "div",
          {
            color,
            fontSize: "22px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          },
          label,
        ),
      ]),
      el(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          maxWidth: "1000px",
        },
        [
          el(
            "div",
            {
              color: "#eef2ff",
              fontSize: `${titleSize(input.title)}px`,
              lineHeight: 1.25,
              fontWeight: 400,
            },
            input.title,
          ),
          el(
            "div",
            { color: "#b9c3e2", fontSize: "26px", lineHeight: 1.45 },
            summary,
          ),
        ],
      ),
      el(
        "div",
        {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        },
        [
          el(
            "div",
            { color: "#eef2ff", fontSize: "24px", letterSpacing: "0.08em" },
            "James Universe",
          ),
          el("div", { color: "#8ab4ff", fontSize: "22px" }, "6ka.dev"),
        ],
      ),
    ],
  );

  const svg = await satori(tree, {
    width: WIDTH,
    height: HEIGHT,
    fonts: await loadFonts(),
  });
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
  }).render();
  return Buffer.from(png.asPng());
}
