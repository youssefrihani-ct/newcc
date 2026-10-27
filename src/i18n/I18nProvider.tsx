import { Fragment, useSyncExternalStore, type ReactNode } from "react";
import { getCatalogueVersion, subscribeCatalogue } from "./t";

/** Re-render the tree when the catalogue changes (language switch or runtime load). */
export function I18nProvider({ children }: { children: ReactNode }) {
  const version = useSyncExternalStore(subscribeCatalogue, getCatalogueVersion, getCatalogueVersion);
  return <Fragment key={version}>{children}</Fragment>;
}
