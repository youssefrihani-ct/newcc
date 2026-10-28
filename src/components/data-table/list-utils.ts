export type SortKey = { id: string; dir: "asc" | "desc" };

/** "name:asc,created:desc": the sort lives in the URL so a view can be shared (spec 5b). */
export function parseSort(value: string | undefined): SortKey[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.split(":"))
    .filter((p): p is [string, "asc" | "desc"] => Boolean(p[0]) && (p[1] === "asc" || p[1] === "desc"))
    .map(([id, dir]) => ({ id, dir }));
}

export function serializeSort(keys: SortKey[]): string | undefined {
  return keys.length ? keys.map((k) => `${k.id}:${k.dir}`).join(",") : undefined;
}

/** CSV cell: quoted, and protected against spreadsheet formula injection. */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export type ListPrefs = { visible: string[]; order: string[]; size: number };

const key = (listId: string) => `cc.list.${listId}.v1`;

/** Column choice and rows per page are remembered per list; unknown columns are dropped, new ones appended. */
export function loadPrefs(listId: string, defaults: ListPrefs): ListPrefs {
  try {
    const raw = localStorage.getItem(key(listId));
    if (!raw) return defaults;
    const saved = JSON.parse(raw) as Partial<ListPrefs>;
    const known = new Set(defaults.order);
    const order = [...(saved.order ?? []).filter((id) => known.has(id)), ...defaults.order.filter((id) => !(saved.order ?? []).includes(id))];
    const visible = (saved.visible ?? defaults.visible).filter((id) => known.has(id));
    const size = [10, 25, 50, 100].includes(saved.size ?? 0) ? (saved.size as number) : defaults.size;
    return { visible: visible.length ? visible : defaults.visible, order, size };
  } catch {
    return defaults;
  }
}

export function savePrefs(listId: string, prefs: ListPrefs): void {
  try {
    localStorage.setItem(key(listId), JSON.stringify(prefs));
  } catch {
    // storage unavailable: the choice lasts for this page only
  }
}
