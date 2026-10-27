import { beforeEach, describe, expect, it } from "vitest";
import { SOURCE_LOCALE, m, setCatalogue, t } from "./t";
import { MESSAGES, messageFor, messageFromError } from "./messages";
import { formatDate, formatDateTime, formatMoney } from "./format";

describe("t()", () => {
  beforeEach(() => setCatalogue(SOURCE_LOCALE, {}));

  it("returns the English text when there is no entry", () => {
    expect(t("Approve claim")).toBe("Approve claim");
  });

  it("looks the text up in the loaded catalogue", () => {
    setCatalogue("fr-FR", { "Approve claim": "Approuver la demande" });
    expect(t("Approve claim")).toBe("Approuver la demande");
  });

  it("falls back to English for a missing entry, never a blank", () => {
    setCatalogue("fr-FR", { "Approve claim": "Approuver la demande" });
    expect(t("Decline claim")).toBe("Decline claim");
  });

  it("fills placeholders and plurals with ICU MessageFormat", () => {
    const text = "{count, plural, one {# claim waiting} other {# claims waiting}}";
    expect(t(text, { count: 1 })).toBe("1 claim waiting");
    expect(t(text, { count: 3 })).toBe("3 claims waiting");
    expect(t("Hello, {name}", { name: "Sam" })).toBe("Hello, Sam");
  });

  it("applies placeholders inside a translation", () => {
    setCatalogue("fr-FR", { "{count} claims waiting": "{count} demandes en attente" });
    expect(t("{count} claims waiting", { count: 4 })).toBe("4 demandes en attente");
  });

  it("falls back to the English text when a translation is malformed", () => {
    setCatalogue("fr-FR", { "Hello, {name}": "Bonjour, {name" });
    expect(t("Hello, {name}", { name: "Sam" })).toBe("Hello, Sam");
  });

  it("m() marks text without translating it", () => {
    expect(m("Approve claim")).toBe("Approve claim");
  });
});

describe("message codes", () => {
  beforeEach(() => setCatalogue(SOURCE_LOCALE, {}));

  it("translates a database message code with its parameters", () => {
    expect(messageFor("security.mfa_policy_cannot_be_loosened", { role: "crc" })).toBe(
      "Two-factor authentication cannot be loosened for crc",
    );
  });

  it("turns a database error into a message", () => {
    expect(messageFromError({ message: "audit.append_only" })).toBe("The audit log cannot be changed");
    expect(
      messageFromError({ message: "security.mfa_policy_must_be_required", details: '{"role":"finance"}' }),
    ).toBe("Two-factor authentication must stay required for finance");
  });

  it("never shows raw database text for an unknown error", () => {
    expect(messageFromError({ message: 'relation "x" does not exist' })).toBe("Something went wrong");
  });

  it("has English text for every code", () => {
    for (const text of Object.values(MESSAGES)) expect(text.length).toBeGreaterThan(0);
  });
});

describe("formatting (en-GB)", () => {
  beforeEach(() => setCatalogue(SOURCE_LOCALE, {}));

  it("formats dates as DD/MM/YYYY and times on the 24-hour clock", () => {
    expect(formatDate("2026-11-14T10:00:00Z", "Europe/London")).toBe("14/11/2026");
    expect(formatDateTime("2026-11-14T15:30:00Z", "Europe/London")).toMatch(/^14\/11\/2026,? 15:30$/);
  });

  it("takes currency precision from the currency, not from an assumption of 2 decimals", () => {
    expect(formatMoney(12050, "GBP")).toBe("£120.50");
    expect(formatMoney(12050, "JPY")).toBe("JP¥12,050");
    expect(formatMoney(12050, "BHD")).toContain("12.050");
  });
});
