import { m, t, type TValues } from "./t";

// Server code (database functions, edge functions) returns a message code plus
// parameters and never display text. Every code the database can raise is listed
// here with its English text; scripts/i18n-extract.mjs fails CI if one is missing.

export const MESSAGES = {
  "record.hard_delete_forbidden": m("This record cannot be deleted"),
  "audit.append_only": m("The audit log cannot be changed"),
  "audit.not_allowed": m("You cannot read the audit log"),
  "profile.field_not_editable": m("You cannot change this field"),
  "security.mfa_override_must_be_stricter": m("A personal setting can only make two-factor authentication stricter"),
  "security.mfa_policy_cannot_be_loosened": m("Two-factor authentication cannot be loosened for {role}"),
  "security.mfa_policy_must_be_required": m("Two-factor authentication must stay required for {role}"),
  "translation.publish_requires_admin": m("Only an admin can publish a language"),
} as const;

export type MessageCode = keyof typeof MESSAGES;

export function messageFor(code: string, params?: TValues): string {
  const text = (MESSAGES as Record<string, string>)[code];
  return text ? t(text, params) : t("Something went wrong");
}

/** Turn an error raised by the database into a translated message. */
export function messageFromError(error: unknown): string {
  const e = error as { message?: string; details?: string } | null;
  const code = e?.message ?? "";
  if (code in MESSAGES) {
    let params: TValues | undefined;
    try {
      params = e?.details ? (JSON.parse(e.details) as TValues) : undefined;
    } catch {
      params = undefined;
    }
    return messageFor(code, params);
  }
  return t("Something went wrong");
}
