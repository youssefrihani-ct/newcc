import { supabase } from "@/lib/supabase";
import { SOURCE_LOCALE, setCatalogue } from "./t";

const cacheKey = (locale: string) => `cc.catalogue.${locale}`;

function readCache(locale: string): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(cacheKey(locale));
    return raw ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

function writeCache(locale: string, entries: Record<string, string>): void {
  try {
    localStorage.setItem(cacheKey(locale), JSON.stringify(entries));
  } catch {
    // storage unavailable: the catalogue is simply fetched again next time
  }
}

/**
 * Load a language from the database at runtime (spec 5d): adding or editing a
 * language needs no redeploy. The source language needs no lookup; a failed
 * fetch falls back to the cached copy and then to English.
 */
export async function loadCatalogue(locale: string): Promise<void> {
  if (locale === SOURCE_LOCALE) {
    setCatalogue(SOURCE_LOCALE, {});
    return;
  }
  const cached = readCache(locale);
  if (cached) setCatalogue(locale, cached);
  const { data, error } = await supabase().rpc("get_catalogue", { lang: locale });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    if (!cached) setCatalogue(SOURCE_LOCALE, {});
    return;
  }
  const entries = data as Record<string, string>;
  writeCache(locale, entries);
  setCatalogue(locale, entries);
}
