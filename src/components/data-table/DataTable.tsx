import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Columns3, Download, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionMenu, type MenuAction } from "@/components/ui/menu";
import { t } from "@/i18n/t";
import { cn } from "@/lib/utils";
import { csvCell, loadPrefs, parseSort, savePrefs, serializeSort, type SortKey } from "./list-utils";

// The one list component used by every list in the product (spec 5b).

export type Column<T> = {
  id: string;
  /** English text, passed through m() by the caller; translated here. */
  header: string;
  cell: (row: T) => ReactNode;
  /** Plain value used for sorting, searching and CSV export. */
  value: (row: T) => string | number;
  defaultVisible?: boolean;
};

export type ListFilter<T> = {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  match: (row: T, value: string) => boolean;
};

/** Sort, search, page and filters live in the URL so a view can be shared. */
export type ListState = { sort?: string; q?: string; page?: number; filters?: Record<string, string> };

const PAGE_SIZES = [10, 25, 50, 100];
const MAX_DEFAULT_COLUMNS = 6;

export function DataTable<T>({
  listId,
  columns,
  rows,
  rowId,
  status,
  state,
  onStateChange,
  filters = [],
  rowActions,
  onRowOpen,
  emptyText,
  onExport,
  exportName,
}: {
  listId: string;
  columns: Column<T>[];
  rows: T[];
  rowId: (row: T) => string;
  status: "loading" | "error" | "ready";
  state: ListState;
  onStateChange: (next: ListState) => void;
  filters?: ListFilter<T>[];
  rowActions?: (row: T) => MenuAction[];
  onRowOpen?: (row: T) => void;
  /** Translated by the caller: one line saying what to do next. */
  emptyText: string;
  onExport?: (info: { rows: number; filters: Record<string, string>; q: string }) => void;
  exportName: string;
}) {
  const defaults = useMemo(() => {
    const visible = columns.filter((c) => c.defaultVisible !== false).slice(0, MAX_DEFAULT_COLUMNS).map((c) => c.id);
    return { visible, order: columns.map((c) => c.id), size: 25 };
  }, [columns]);
  const [prefs, setPrefs] = useState(defaults);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRoot = useRef<HTMLDivElement>(null);

  useEffect(() => setPrefs(loadPrefs(listId, defaults)), [listId, defaults]);
  useEffect(() => {
    if (!columnsOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!columnsRoot.current?.contains(event.target as Node)) setColumnsOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [columnsOpen]);

  function updatePrefs(next: typeof prefs) {
    setPrefs(next);
    savePrefs(listId, next);
  }

  const byId = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);
  const ordered = prefs.order.map((id) => byId.get(id)).filter((c): c is Column<T> => Boolean(c));
  const visible = ordered.filter((c) => prefs.visible.includes(c.id));

  const sortKeys = parseSort(state.sort);
  const q = (state.q ?? "").trim().toLowerCase();
  const activeFilters = state.filters ?? {};

  const processed = useMemo(() => {
    let out = rows;
    for (const filter of filters) {
      const value = activeFilters[filter.id];
      if (value) out = out.filter((row) => filter.match(row, value));
    }
    if (q) out = out.filter((row) => columns.some((c) => String(c.value(row)).toLowerCase().includes(q)));
    if (sortKeys.length > 0) {
      out = [...out].sort((a, b) => {
        for (const key of sortKeys) {
          const column = byId.get(key.id);
          if (!column) continue;
          const av = column.value(a);
          const bv = column.value(b);
          const cmp =
            typeof av === "number" && typeof bv === "number"
              ? av - bv
              : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
          if (cmp !== 0) return key.dir === "asc" ? cmp : -cmp;
        }
        return 0;
      });
    }
    return out;
  }, [rows, filters, activeFilters, q, sortKeys, columns, byId]);

  const total = processed.length;
  const pages = Math.max(1, Math.ceil(total / prefs.size));
  const page = Math.min(Math.max(1, state.page ?? 1), pages);
  const slice = processed.slice((page - 1) * prefs.size, page * prefs.size);

  function toggleSort(id: string, additive: boolean) {
    const current = sortKeys.find((k) => k.id === id);
    const nextDir: SortKey["dir"] | null = !current ? "asc" : current.dir === "asc" ? "desc" : null;
    let next: SortKey[];
    if (additive) {
      next = sortKeys.filter((k) => k.id !== id);
      if (nextDir) next.push({ id, dir: nextDir });
    } else {
      next = nextDir ? [{ id, dir: nextDir }] : [];
    }
    onStateChange({ ...state, sort: serializeSort(next), page: 1 });
  }

  function exportCsv() {
    const header = visible.map((c) => csvCell(t(c.header))).join(",");
    const lines = processed.map((row) => visible.map((c) => csvCell(String(c.value(row)))).join(","));
    const blob = new Blob(["﻿" + [header, ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onExport?.({ rows: processed.length, filters: activeFilters, q });
  }

  const hasActions = Boolean(rowActions);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <Search size={16} aria-hidden className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            className="ps-9"
            placeholder={t("Search")}
            aria-label={t("Search")}
            value={state.q ?? ""}
            onChange={(event) => onStateChange({ ...state, q: event.target.value, page: 1 })}
          />
        </div>
        {filters.map((filter) => (
          <select
            key={filter.id}
            aria-label={t(filter.label)}
            className="min-h-11 rounded-lg border border-border bg-surface px-3 text-sm"
            value={activeFilters[filter.id] ?? ""}
            onChange={(event) => {
              const next = { ...activeFilters };
              if (event.target.value) next[filter.id] = event.target.value;
              else delete next[filter.id];
              onStateChange({ ...state, filters: next, page: 1 });
            }}
          >
            <option value="">{t(filter.label)}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}
        <div className="ms-auto flex items-center gap-1">
          <div ref={columnsRoot} className="relative">
            <Button variant="secondary" aria-expanded={columnsOpen} onClick={() => setColumnsOpen((v) => !v)}>
              <Columns3 size={16} aria-hidden />
              {t("Columns")}
            </Button>
            {columnsOpen ? (
              <div className="absolute end-0 z-20 mt-1 w-64 rounded-lg border border-border bg-surface p-2 shadow-lg">
                <ul>
                  {ordered.map((column, index) => (
                    <li key={column.id} className="flex items-center gap-1">
                      <label className="flex min-h-11 flex-1 items-center gap-2 px-2 text-sm">
                        <input
                          type="checkbox"
                          checked={prefs.visible.includes(column.id)}
                          onChange={(event) =>
                            updatePrefs({
                              ...prefs,
                              visible: event.target.checked
                                ? [...prefs.visible, column.id]
                                : prefs.visible.filter((id) => id !== column.id),
                            })
                          }
                        />
                        {t(column.header)}
                      </label>
                      <button
                        className="flex size-9 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30"
                        aria-label={t("Move up")}
                        disabled={index === 0}
                        onClick={() => {
                          const order = [...prefs.order];
                          const at = order.indexOf(column.id);
                          [order[at - 1], order[at]] = [order[at]!, order[at - 1]!];
                          updatePrefs({ ...prefs, order });
                        }}
                      >
                        <ArrowUp size={14} aria-hidden />
                      </button>
                      <button
                        className="flex size-9 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30"
                        aria-label={t("Move down")}
                        disabled={index === ordered.length - 1}
                        onClick={() => {
                          const order = [...prefs.order];
                          const at = order.indexOf(column.id);
                          [order[at + 1], order[at]] = [order[at]!, order[at + 1]!];
                          updatePrefs({ ...prefs, order });
                        }}
                      >
                        <ArrowDown size={14} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" className="mt-1 w-full" onClick={() => updatePrefs(defaults)}>
                  {t("Reset to default")}
                </Button>
              </div>
            ) : null}
          </div>
          <Button variant="secondary" disabled={status !== "ready" || total === 0} onClick={exportCsv}>
            <Download size={16} aria-hidden />
            {t("Export")}
          </Button>
        </div>
      </div>

      {status === "loading" ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label={t("Loading")}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
          ))}
        </div>
      ) : status === "error" ? (
        <p role="alert" className="rounded-lg border border-border p-6 text-center text-danger">
          {t("Something went wrong")}
        </p>
      ) : total === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">{emptyText}</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-muted text-start">
                <tr>
                  {visible.map((column) => {
                    const key = sortKeys.find((k) => k.id === column.id);
                    return (
                      <th
                        key={column.id}
                        scope="col"
                        aria-sort={key ? (key.dir === "asc" ? "ascending" : "descending") : "none"}
                        className="px-4 py-2 text-start font-semibold"
                      >
                        <button
                          className="inline-flex min-h-9 items-center gap-1 hover:text-primary"
                          onClick={(event) => toggleSort(column.id, event.shiftKey)}
                        >
                          {t(column.header)}
                          {key ? (key.dir === "asc" ? <ArrowUp size={14} aria-hidden /> : <ArrowDown size={14} aria-hidden />) : null}
                        </button>
                      </th>
                    );
                  })}
                  {hasActions ? (
                    <th scope="col" className="w-14 px-2">
                      <span className="sr-only">{t("Actions")}</span>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {slice.map((row) => (
                  <tr
                    key={rowId(row)}
                    tabIndex={onRowOpen ? 0 : undefined}
                    className={cn("border-t border-border", onRowOpen && "cursor-pointer hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none")}
                    onClick={() => onRowOpen?.(row)}
                    onKeyDown={(event) => {
                      if (onRowOpen && event.key === "Enter" && event.target === event.currentTarget) onRowOpen(row);
                    }}
                  >
                    {visible.map((column) => (
                      <td key={column.id} className="px-4 py-2 align-middle">
                        {column.cell(row)}
                      </td>
                    ))}
                    {hasActions ? (
                      <td className="px-2 text-end">
                        <ActionMenu actions={rowActions?.(row) ?? []} />
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-2 md:hidden">
            {slice.map((row) => (
              <li
                key={rowId(row)}
                tabIndex={onRowOpen ? 0 : undefined}
                className="rounded-xl border border-border bg-surface p-4"
                onClick={() => onRowOpen?.(row)}
                onKeyDown={(event) => {
                  if (onRowOpen && event.key === "Enter" && event.target === event.currentTarget) onRowOpen(row);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 font-semibold">{visible[0]?.cell(row)}</div>
                  {hasActions ? <ActionMenu actions={rowActions?.(row) ?? []} /> : null}
                </div>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  {visible.slice(1, 5).map((column) => (
                    <div key={column.id} className="contents">
                      <dt className="text-muted-foreground">{t(column.header)}</dt>
                      <dd className="min-w-0">{column.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{t("{from}–{to} of {total}", { from: (page - 1) * prefs.size + 1, to: Math.min(page * prefs.size, total), total })}</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                {t("Rows per page")}
                <select
                  className="min-h-11 rounded-lg border border-border bg-surface px-2 text-foreground"
                  value={prefs.size}
                  onChange={(event) => {
                    updatePrefs({ ...prefs, size: Number(event.target.value) });
                    onStateChange({ ...state, page: 1 });
                  }}
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <Button variant="ghost" className="min-w-11 px-2" aria-label={t("Previous page")} disabled={page <= 1} onClick={() => onStateChange({ ...state, page: page - 1 })}>
                <ChevronLeft size={18} aria-hidden />
              </Button>
              <Button variant="ghost" className="min-w-11 px-2" aria-label={t("Next page")} disabled={page >= pages} onClick={() => onStateChange({ ...state, page: page + 1 })}>
                <ChevronRight size={18} aria-hidden />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
