/**
 * Accessibility smoke check for the static pages. Uses the system Chrome when
 * one is installed (local dev and GitHub Actions after setup-chrome); otherwise
 * pa11y falls back to Puppeteer's browser.
 */
const { execSync } = require("node:child_process");

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  for (const bin of [
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
  ]) {
    try {
      const found = execSync(`command -v ${bin}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (found) return found;
    } catch {
      /* try the next name */
    }
  }
  return undefined;
}

const executablePath = chromePath();

module.exports = {
  defaults: {
    standard: "WCAG2AA",
    timeout: 45000,
    wait: 1000,
    chromeLaunchConfig: {
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--enable-unsafe-swiftshader",
      ],
      ...(executablePath ? { executablePath } : {}),
    },
  },
  // The 3D index is omitted: pa11y navigates with networkidle2, and that
  // signal never arrives on the canvas page even after every request has
  // finished. The document pages below are the text surfaces.
  urls: [
    "http://127.0.0.1:4321/posts/pnpm/",
    "http://127.0.0.1:4321/posts/mono-repo/",
    "http://127.0.0.1:4321/tags/",
    "http://127.0.0.1:4321/tags/html/",
    "http://127.0.0.1:4321/en/tags/",
    "http://127.0.0.1:4321/en/posts/pnpm/",
  ],
};
