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
  "auth.not_allowed": m("You cannot do this"),
  "auth.self_grant_forbidden": m("You cannot do this to your own account"),
  "reason.required": m("Enter a reason"),
  "signature.immutable": m("A signature cannot be changed"),
  "signature.unknown_record_type": m("This record cannot be signed"),
  "signature.not_authenticated": m("Sign in to continue"),
  "signature.reauth_required": m("Enter your password again to sign"),
  "signature.reauth_code_required": m("Enter your authenticator code to sign"),
  "signature.unknown_action": m("This action has no signature policy"),
  "signature.invalid_meaning": m("Choose a valid signature meaning"),
  "signature.invalid_outcome": m("Invalid signing outcome"),
  "signature.locked": m("Signing is locked after repeated failures. Try again later"),
  "signature.statement_not_accepted": m("Accept the electronic signature statement first"),
  "role.not_grantable": m("This role cannot be granted here"),
  "role.already_granted": m("This person already has this role"),
  "role.not_found": m("Role not found"),
  "role.last_admin": m("The last admin cannot be removed"),
  "user.not_found": m("User not found"),
  "user.invalid_status": m("Invalid user status"),
  "user.invalid_email": m("Enter a valid email address"),
  "user.name_required": m("Enter a name"),
  "user.email_taken": m("This email is already in use"),
  "study.not_found": m("Study not found"),
  "assignment.role_missing": m("Grant this person the role first"),
  "assignment.already_exists": m("Already assigned"),
  "assignment.role_not_assignable": m("This role is not assigned to a site"),
  "assignment.site_not_in_study": m("This site is not part of the study"),
  "assignment.unknown_kind": m("Unknown assignment type"),
  "assignment.not_found": m("Assignment not found"),
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
