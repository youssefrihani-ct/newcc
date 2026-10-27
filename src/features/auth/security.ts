import { supabase } from "@/lib/supabase";

export type SecurityState = {
  user_id: string;
  roles: string[];
  mfa_policy: "off" | "optional" | "required";
  aal: "aal1" | "aal2";
  mfa_satisfied: boolean;
  demo_mode: boolean;
};

export async function fetchSecurityState(): Promise<SecurityState> {
  const { data, error } = await supabase().rpc("my_security_state");
  if (error) throw error;
  return data as unknown as SecurityState;
}

/** Where a signed-in user must go before any data is reachable (spec 17b enrolment rule). */
export function needsSecondFactor(state: SecurityState): boolean {
  return !state.mfa_satisfied;
}
