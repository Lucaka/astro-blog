/**
 * Turn HackMD-style container directives (`:::info` / `:::warning` …) into
 * styled callout <aside> blocks. Pairs with `remark-directive`, which parses
 * the `:::name` syntax into `containerDirective` nodes; this plugin gives those
 * nodes an HTML tag, a class, and a localized label so they render as the
 * coloured callouts used throughout the notes (see [slug].astro for styling).
 */

// Directive name → visible label (zh-Hant). Anything not listed is left as-is.
const LABELS = {
  info: "補充",
  note: "補充",
  tip: "提示",
  success: "完成",
  warning: "注意",
  danger: "警告",
};

export default function remarkCallouts() {
  return (tree) => walk(tree);
}

function walk(node) {
  if (!node.children) return;
  for (const child of node.children) {
    if (child.type === "containerDirective" && child.name in LABELS) {
      const data = (child.data ??= {});
      data.hName = "aside";
      data.hProperties = {
        className: ["callout", `callout--${child.name}`],
      };
      // Prepend a label row so readers see "注意 / 補充 …" above the content.
      child.children.unshift({
        type: "paragraph",
        data: {
          hName: "p",
          hProperties: { className: ["callout__label"] },
        },
        children: [{ type: "text", value: LABELS[child.name] }],
      });
    }
    walk(child);
  }
}
