import IntlMessageFormat from "intl-messageformat";

// English text is the key; other languages are lookups (spec 5d).
// `t()` and `m()` calls are found by scripts/i18n-extract.mjs, so the first
// argument must be a plain string literal.

export const SOURCE_LOCALE = "en-GB";

let locale = SOURCE_LOCALE;
let catalogue: Record<string, string> = {};
const formatters = new Map<string, IntlMessageFormat>();
const listeners = new Set<() => void>();
let version = 0;

export function setCatalogue(nextLocale: string, entries: Record<string, string>): void {
  locale = nextLocale;
  catalogue = entries;
  formatters.clear();
  version += 1;
  listeners.forEach((listener) => listener());
}

export function getLocale(): string {
  return locale;
}

export function getCatalogueVersion(): number {
  return version;
}

export function subscribeCatalogue(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export type TValues = Record<string, string | number | boolean | Date | null | undefined>;

/** Translate English source text. Missing entries fall back to the English text, never to a blank. */
export function t(text: string, values?: TValues): string {
  const message = catalogue[text] ?? text;
  if (!values && !message.includes("{")) return message;
  let formatter = formatters.get(message);
  if (!formatter) {
    try {
      formatter = new IntlMessageFormat(message, locale);
    } catch {
      formatter = new IntlMessageFormat(text, SOURCE_LOCALE);
    }
    formatters.set(message, formatter);
  }
  try {
    return String(formatter.format(values as Record<string, never>));
  } catch {
    return text;
  }
}

/** Mark a string as translatable without translating it now (enumeration labels, message registries). */
export function m<T extends string>(text: T): T {
  return text;
}
