/**
 * Category presentation helpers shared by the UI components (legend, sidebar,
 * tooltips, reading panel).
 */
import { CATEGORY_META, type PostCategory } from "../data/posts";

/** CSS hex color of a category's star tint, e.g. "#ffd54a". */
export function catColor(category: PostCategory): string {
  return "#" + CATEGORY_META[category].color.toString(16).padStart(6, "0");
}

/** Human-readable label of a category. */
export function catLabel(category: PostCategory): string {
  return CATEGORY_META[category].label;
}
