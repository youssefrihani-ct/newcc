// A person can hold several roles; the highest one decides the navigation they see.
const PRIORITY = ["admin", "study_manager", "site_manager", "crc", "finance", "auditor", "participant"] as const;

export function primaryRole(roles: string[]): string {
  return PRIORITY.find((role) => roles.includes(role)) ?? "participant";
}

export function isStaffRole(role: string): boolean {
  return role !== "participant" && role !== "sponsor";
}
