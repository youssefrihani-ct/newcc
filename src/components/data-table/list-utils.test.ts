import { beforeEach, describe, expect, it } from "vitest";
import { csvCell, loadPrefs, parseSort, serializeSort } from "./list-utils";

describe("sort in the URL", () => {
  it("round-trips one and two sort keys", () => {
    expect(parseSort("name:asc,created:desc")).toEqual([
      { id: "name", dir: "asc" },
      { id: "created", dir: "desc" },
    ]);
    expect(serializeSort(parseSort("name:asc,created:desc"))).toBe("name:asc,created:desc");
  });

  it("ignores malformed parts and empty input", () => {
    expect(parseSort(undefined)).toEqual([]);
    expect(parseSort("name:sideways,:asc,ok:asc")).toEqual([{ id: "ok", dir: "asc" }]);
    expect(serializeSort([])).toBeUndefined();
  });
});

describe("csvCell", () => {
  it("quotes and escapes", () => {
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
  });

  it("neutralises spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe(`"'=HYPERLINK(1)"`);
    expect(csvCell("+1")).toBe(`"'+1"`);
    expect(csvCell("-1")).toBe(`"'-1"`);
    expect(csvCell("@cmd")).toBe(`"'@cmd"`);
    expect(csvCell("plain")).toBe('"plain"');
  });
});

describe("saved list preferences", () => {
  const defaults = { visible: ["a", "b"], order: ["a", "b", "c"], size: 25 };

  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    } as Storage;
  });

  it("falls back to defaults when nothing is saved", () => {
    expect(loadPrefs("x", defaults)).toEqual(defaults);
  });

  it("drops unknown columns, appends new ones and rejects odd page sizes", () => {
    localStorage.setItem("cc.list.x.v1", JSON.stringify({ visible: ["c", "gone"], order: ["c", "gone", "a"], size: 7 }));
    expect(loadPrefs("x", defaults)).toEqual({ visible: ["c"], order: ["c", "a", "b"], size: 25 });
  });
});
