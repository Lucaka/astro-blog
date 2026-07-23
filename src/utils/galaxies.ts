import type { Post } from "../data/posts";
import { parseDisplayDate } from "./posts";

/**
 * Semantic-zoom hierarchy for the universe: posts are chunked into "galaxies"
 * of at most GALAXY_CAPACITY stars each, and the set of galaxies forms the
 * "galaxy group" the camera can zoom out to. The structure is deliberately
 * flat for now — if the group itself ever outgrows one screen, a third
 * "cluster" level can wrap `Galaxy[]` the same way this wraps `Post[]`.
 */
export const GALAXY_CAPACITY = 40;

export interface Galaxy {
  id: string;
  /**
   * 1-based volume number, chronological (galaxy 1 holds the oldest posts).
   * The display name ("第 2 星系" / "Galaxy 2") is formatted at render time
   * from this index via the `galaxy.name` UI string, so the data stays
   * locale-free.
   */
  index: number;
  /** Year range of its posts, e.g. "2024–2025". */
  era: string;
  /** The galaxy's posts, newest first (same ordering the index page uses). */
  posts: Post[];
}

/**
 * Chunk posts into galaxies of `capacity`, counting from the OLDEST post.
 * Counting from the oldest keeps every existing galaxy stable as new posts
 * are published: the newest galaxy fills up to `capacity`, then the next one
 * is born — nothing ever re-shuffles between volumes.
 */
export function partitionIntoGalaxies(
  posts: Post[],
  capacity = GALAXY_CAPACITY,
): Galaxy[] {
  const chronological = [...posts].sort(
    (a, b) =>
      parseDisplayDate(a.date).getTime() - parseDisplayDate(b.date).getTime(),
  );

  const galaxies: Galaxy[] = [];
  for (let start = 0; start < chronological.length; start += capacity) {
    const chunk = chronological.slice(start, start + capacity);
    const firstYear = parseDisplayDate(chunk[0].date).getFullYear();
    const lastYear = parseDisplayDate(
      chunk[chunk.length - 1].date,
    ).getFullYear();
    const index = galaxies.length + 1;
    galaxies.push({
      id: `galaxy-${index}`,
      index,
      era: firstYear === lastYear ? `${firstYear}` : `${firstYear}–${lastYear}`,
      posts: chunk.slice().reverse(),
    });
  }
  return galaxies;
}

/** The galaxy a given post lives in (by slug), or null if unknown. */
export function findGalaxyOf(
  galaxies: Galaxy[],
  slug: string,
): Galaxy | null {
  return galaxies.find((g) => g.posts.some((p) => p.slug === slug)) ?? null;
}
