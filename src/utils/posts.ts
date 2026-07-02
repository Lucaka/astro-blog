/**
 * Helpers shared by the index page, the static post pages, the RSS feed and
 * the client island (which uses `postPath` for pushState deep links).
 */

/** Parse the display date ("2025.04" or "2025.04.16") into a real Date. */
export function parseDisplayDate(display: string): Date {
  const [year, month = "1", day = "1"] = display.split(".");
  return new Date(Number(year), Number(month) - 1, Number(day));
}

/**
 * Estimated reading time in whole minutes from raw Markdown. CJK is counted
 * per character (~300 chars/min), everything else per word (~200 words/min).
 */
export function readingTimeMinutes(markdown: string): number {
  const cjk = markdown.match(/[一-鿿㐀-䶿]/g)?.length ?? 0;
  const words =
    markdown
      .replace(/[一-鿿㐀-䶿]/g, " ")
      .match(/[A-Za-z0-9_'-]+/g)?.length ?? 0;
  return Math.max(1, Math.round(cjk / 300 + words / 200));
}

/** Site-relative path of a post page, respecting the configured base. */
export function postPath(slug: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/posts/${slug}/`;
}
