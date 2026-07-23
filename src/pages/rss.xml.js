import { buildFeed } from "../utils/feed";

export function GET(context) {
  return buildFeed(context, "zh-hant");
}
