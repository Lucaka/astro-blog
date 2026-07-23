/**
 * Translation lookup for posts. English renderings live beside each original
 * as `<slug>.en.md` and load into the `postTranslations` collection with id
 * `<slug>.en`. These helpers resolve "does post X have a translation in locale
 * Y" once, so the post pages (both locales) can flip between the real
 * translation and the source-language fallback.
 *
 * Server-only (imports `astro:content`) — never import from the client island.
 */
import { getCollection, type CollectionEntry } from "astro:content";
import { DEFAULT_LOCALE, type Locale } from "../i18n/config";

export type TranslationEntry = CollectionEntry<"postTranslations">;

/** Map of translation id ("pnpm.en") -> entry, built once per build/render. */
export async function loadTranslations(): Promise<
  Map<string, TranslationEntry>
> {
  const entries = await getCollection("postTranslations");
  return new Map(entries.map((entry) => [entry.id, entry]));
}

/**
 * The translation of `baseId` for `locale`, or null. The default locale is the
 * source language itself, so it never has a separate translation entry.
 */
export function translationOf(
  translations: Map<string, TranslationEntry>,
  baseId: string,
  locale: Locale,
): TranslationEntry | null {
  if (locale === DEFAULT_LOCALE) return null;
  return translations.get(`${baseId}.${locale}`) ?? null;
}
