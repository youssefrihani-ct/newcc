import { m, t } from "./t";

// Enumerations display through catalogue labels, never raw values (spec 5d).

const ROLE_LABELS = {
  admin: m("Admin"),
  study_manager: m("Study Manager"),
  site_manager: m("Site Manager"),
  crc: m("CRC"),
  finance: m("Finance"),
  participant: m("Participant"),
  auditor: m("Auditor"),
  sponsor: m("Sponsor"),
} as const;

export type AppRole = keyof typeof ROLE_LABELS;

export function roleLabel(role: string): string {
  const label = (ROLE_LABELS as Record<string, string>)[role];
  return label ? t(label) : t("Unknown role");
}

const MFA_POLICY_LABELS = {
  off: m("Off"),
  optional: m("Optional"),
  required: m("Required"),
} as const;

export function mfaPolicyLabel(policy: string): string {
  const label = (MFA_POLICY_LABELS as Record<string, string>)[policy];
  return label ? t(label) : t("Unknown");
}
