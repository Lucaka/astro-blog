/**
 * Extras for rendered Markdown that CSS alone cannot express:
 * images load lazily, and tables are wrapped so wide ones scroll instead of
 * stretching the page.
 */
export default function rehypeContent() {
  return (tree) => walk(tree, null, -1);
}

function walk(node, parent, index) {
  if (!node || typeof node !== "object") return;

  if (node.type === "element") {
    if (node.tagName === "img") {
      const props = (node.properties ??= {});
      if (!props.loading) props.loading = "lazy";
      if (!props.decoding) props.decoding = "async";
    }

    if (
      node.tagName === "table" &&
      parent &&
      Array.isArray(parent.children) &&
      !isTableScroll(parent)
    ) {
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["table-scroll"] },
        children: [node],
      };
      const children = node.children ?? [];
      for (let i = 0; i < children.length; i++) walk(children[i], node, i);
      return;
    }
  }

  const children = node.children;
  if (!Array.isArray(children)) return;
  for (let i = 0; i < children.length; i++) walk(children[i], node, i);
}

function isTableScroll(node) {
  if (node.tagName !== "div") return false;
  const className = node.properties?.className;
  if (Array.isArray(className)) return className.includes("table-scroll");
  if (typeof className === "string") {
    return className.split(/\s+/).includes("table-scroll");
  }
  return false;
}
