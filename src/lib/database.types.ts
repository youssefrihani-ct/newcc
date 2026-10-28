
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "audit_chain_head": {
                  Row: {
                    "id": boolean,"last_hash": string,"last_id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: boolean,"last_hash"?: string,"last_id"?: number
                  }
                  Update: {
                    "id"?: boolean,"last_hash"?: string,"last_id"?: number
                  }
                  Relationships: [
                    
                  ]
                },"audit_daily_roots": {
                  Row: {
                    "day": string,"last_id": number,"root_hash": string,"stored_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "day": string,"last_id": number,"root_hash": string,"stored_at"?: string
                  }
                  Update: {
                    "day"?: string,"last_id"?: number,"root_hash"?: string,"stored_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2026_01": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2026_02": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2026_03": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2026_04": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2026_05": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2026_06": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2026_07": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2026_08": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2026_09": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2026_10": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2026_11": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2026_12": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2027_01": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2027_02": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2027_03": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2027_04": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2027_05": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2027_06": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2027_07": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2027_08": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2027_09": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2027_10": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2027_11": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2027_12": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2028_01": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2028_02": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2028_03": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2028_04": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2028_05": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2028_06": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2028_07": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2028_08": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2028_09": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2028_10": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2028_11": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_2028_12": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"audit_log_default": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_name": string | null,"actor_role": string | null,"changed_fields": NonNullable<Json>,"entity_id": string | null,"entity_type": string,"hash": string,"id": number,"ip_address": string | null,"occurred_at": string,"on_behalf_of": string | null,"prev_hash": string,"reason": string | null,"reason_code": string | null,"request_id": string | null,"scope_client_id": string | null,"scope_participant_id": string | null,"scope_site_id": string | null,"scope_trial_id": string | null,"session_id": string | null,"signature_id": string | null,"source": string,"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type": string,"hash": string,"id": number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash": string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_name"?: string | null,"actor_role"?: string | null,"changed_fields"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string,"hash"?: string,"id"?: number,"ip_address"?: string | null,"occurred_at"?: string,"on_behalf_of"?: string | null,"prev_hash"?: string,"reason"?: string | null,"reason_code"?: string | null,"request_id"?: string | null,"scope_client_id"?: string | null,"scope_participant_id"?: string | null,"scope_site_id"?: string | null,"scope_trial_id"?: string | null,"session_id"?: string | null,"signature_id"?: string | null,"source"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"clients": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"finance_scopes": {
                  Row: {
                    "client_id": string | null,"created_at": string,"id": string,"revoked_at": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id"?: string | null,"created_at"?: string,"id"?: string,"revoked_at"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "client_id"?: string | null,"created_at"?: string,"id"?: string,"revoked_at"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "finance_scopes_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "finance_scopes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"glossary": {
                  Row: {
                    "created_at": string,"id": string,"language_code": string,"mode": string,"term": string,"translation": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"language_code": string,"mode"?: string,"term": string,"translation"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"language_code"?: string,"mode"?: string,"term"?: string,"translation"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "glossary_language_code_fkey"
      columns: ["language_code"]
isOneToOne: false
      referencedRelation: "languages"
      referencedColumns: ["code"]
    }
                  ]
                },"languages": {
                  Row: {
                    "code": string,"created_at": string,"direction": string,"english_name": string,"fallback_code": string | null,"id": string,"is_default": boolean,"native_name": string,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"direction"?: string,"english_name": string,"fallback_code"?: string | null,"id"?: string,"is_default"?: boolean,"native_name": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"direction"?: string,"english_name"?: string,"fallback_code"?: string | null,"id"?: string,"is_default"?: boolean,"native_name"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "languages_fallback_code_fkey"
      columns: ["fallback_code"]
isOneToOne: false
      referencedRelation: "languages"
      referencedColumns: ["code"]
    }
                  ]
                },"participant_profiles": {
                  Row: {
                    "created_at": string,"id": string,"site_id": string,"status": string,"subject_code": string,"trial_id": string,"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"site_id": string,"status"?: string,"subject_code": string,"trial_id": string,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"site_id"?: string,"status"?: string,"subject_code"?: string,"trial_id"?: string,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "participant_profiles_site_id_fkey"
      columns: ["site_id"]
isOneToOne: false
      referencedRelation: "sites"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "participant_profiles_trial_id_fkey"
      columns: ["trial_id"]
isOneToOne: false
      referencedRelation: "trials"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "participant_profiles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"platform_settings": {
                  Row: {
                    "created_at": string,"id": string,"key": string,"updated_at": string,"updated_by": string | null,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"key": string,"updated_at"?: string,"updated_by"?: string | null,"value": NonNullable<Json>
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"key"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "platform_settings_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_path": string | null,"created_at": string,"email": string | null,"full_name": string,"id": string,"language": string,"mfa_policy_override": Database["public"]['Enums']["mfa_policy"] | null,"must_change_password": boolean,"phone": string | null,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_path"?: string | null,"created_at"?: string,"email"?: string | null,"full_name"?: string,"id": string,"language"?: string,"mfa_policy_override"?: Database["public"]['Enums']["mfa_policy"] | null,"must_change_password"?: boolean,"phone"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "avatar_path"?: string | null,"created_at"?: string,"email"?: string | null,"full_name"?: string,"id"?: string,"language"?: string,"mfa_policy_override"?: Database["public"]['Enums']["mfa_policy"] | null,"must_change_password"?: boolean,"phone"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"role_mfa_policies": {
                  Row: {
                    "created_at": string,"id": string,"policy": Database["public"]['Enums']["mfa_policy"],"role": Database["public"]['Enums']["app_role"],"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"policy"?: Database["public"]['Enums']["mfa_policy"],"role": Database["public"]['Enums']["app_role"],"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"policy"?: Database["public"]['Enums']["mfa_policy"],"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "role_mfa_policies_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"signature_acknowledgements": {
                  Row: {
                    "accepted_at": string,"created_at": string,"id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string,"created_at"?: string,"id"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "accepted_at"?: string,"created_at"?: string,"id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "signature_acknowledgements_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"signature_attempts": {
                  Row: {
                    "created_at": string,"id": string,"outcome": string,"reason": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"outcome": string,"reason"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"outcome"?: string,"reason"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "signature_attempts_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"signature_policies": {
                  Row: {
                    "action": string,"created_at": string,"id": string,"meaning": string,"required": boolean,"second_signer_above_amount": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"created_at"?: string,"id"?: string,"meaning"?: string,"required"?: boolean,"second_signer_above_amount"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "action"?: string,"created_at"?: string,"id"?: string,"meaning"?: string,"required"?: boolean,"second_signer_above_amount"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"signatures": {
                  Row: {
                    "action": string,"auth_method": string,"content_hash": string,"created_at": string,"device": string | null,"full_name": string,"id": string,"ip_address": string | null,"meaning": string,"record_id": string,"record_type": string,"record_version": number,"role_title": string,"signed_at": string,"superseded_at": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"auth_method": string,"content_hash": string,"created_at"?: string,"device"?: string | null,"full_name": string,"id"?: string,"ip_address"?: string | null,"meaning": string,"record_id": string,"record_type": string,"record_version"?: number,"role_title": string,"signed_at"?: string,"superseded_at"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "action"?: string,"auth_method"?: string,"content_hash"?: string,"created_at"?: string,"device"?: string | null,"full_name"?: string,"id"?: string,"ip_address"?: string | null,"meaning"?: string,"record_id"?: string,"record_type"?: string,"record_version"?: number,"role_title"?: string,"signed_at"?: string,"superseded_at"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "signatures_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"site_staff_assignments": {
                  Row: {
                    "created_at": string,"id": string,"revoked_at": string | null,"role": Database["public"]['Enums']["app_role"],"site_id": string,"trial_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"revoked_at"?: string | null,"role": Database["public"]['Enums']["app_role"],"site_id": string,"trial_id": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"revoked_at"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"site_id"?: string,"trial_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "site_staff_assignments_site_id_fkey"
      columns: ["site_id"]
isOneToOne: false
      referencedRelation: "sites"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "site_staff_assignments_trial_id_fkey"
      columns: ["trial_id"]
isOneToOne: false
      referencedRelation: "trials"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "site_staff_assignments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"sites": {
                  Row: {
                    "country": string,"created_at": string,"id": string,"name": string,"status": string,"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "country"?: string,"created_at"?: string,"id"?: string,"name": string,"status"?: string,"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "country"?: string,"created_at"?: string,"id"?: string,"name"?: string,"status"?: string,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"study_team_assignments": {
                  Row: {
                    "created_at": string,"id": string,"revoked_at": string | null,"role": Database["public"]['Enums']["app_role"],"trial_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"revoked_at"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"trial_id": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"revoked_at"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"trial_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "study_team_assignments_trial_id_fkey"
      columns: ["trial_id"]
isOneToOne: false
      referencedRelation: "trials"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "study_team_assignments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"translation_history": {
                  Row: {
                    "changed_at": string,"changed_by": string | null,"created_at": string,"id": string,"new_status": string | null,"new_text": string | null,"old_status": string | null,"old_text": string | null,"translation_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "changed_at"?: string,"changed_by"?: string | null,"created_at"?: string,"id"?: string,"new_status"?: string | null,"new_text"?: string | null,"old_status"?: string | null,"old_text"?: string | null,"translation_id": string,"updated_at"?: string
                  }
                  Update: {
                    "changed_at"?: string,"changed_by"?: string | null,"created_at"?: string,"id"?: string,"new_status"?: string | null,"new_text"?: string | null,"old_status"?: string | null,"old_text"?: string | null,"translation_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "translation_history_translation_id_fkey"
      columns: ["translation_id"]
isOneToOne: false
      referencedRelation: "translations"
      referencedColumns: ["id"]
    }
                  ]
                },"translation_keys": {
                  Row: {
                    "context": string | null,"created_at": string,"id": string,"key": string,"last_changed_at": string,"placeholders": (string)[],"protected_terms": (string)[],"source_hash": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "context"?: string | null,"created_at"?: string,"id"?: string,"key": string,"last_changed_at"?: string,"placeholders"?: (string)[],"protected_terms"?: (string)[],"source_hash"?: never,"updated_at"?: string
                  }
                  Update: {
                    "context"?: string | null,"created_at"?: string,"id"?: string,"key"?: string,"last_changed_at"?: string,"placeholders"?: (string)[],"protected_terms"?: (string)[],"source_hash"?: never,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"translations": {
                  Row: {
                    "created_at": string,"id": string,"key_id": string,"language_code": string,"reviewed_by": string | null,"status": string,"text": string,"translated_by": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"key_id": string,"language_code": string,"reviewed_by"?: string | null,"status"?: string,"text"?: string,"translated_by"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"key_id"?: string,"language_code"?: string,"reviewed_by"?: string | null,"status"?: string,"text"?: string,"translated_by"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "translations_key_id_fkey"
      columns: ["key_id"]
isOneToOne: false
      referencedRelation: "translation_keys"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "translations_language_code_fkey"
      columns: ["language_code"]
isOneToOne: false
      referencedRelation: "languages"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "translations_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "translations_translated_by_fkey"
      columns: ["translated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"trial_sites": {
                  Row: {
                    "created_at": string,"id": string,"site_id": string,"status": string,"trial_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"site_id": string,"status"?: string,"trial_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"site_id"?: string,"status"?: string,"trial_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trial_sites_site_id_fkey"
      columns: ["site_id"]
isOneToOne: false
      referencedRelation: "sites"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trial_sites_trial_id_fkey"
      columns: ["trial_id"]
isOneToOne: false
      referencedRelation: "trials"
      referencedColumns: ["id"]
    }
                  ]
                },"trials": {
                  Row: {
                    "client_id": string | null,"code": string,"created_at": string,"id": string,"status": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id"?: string | null,"code": string,"created_at"?: string,"id"?: string,"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "client_id"?: string | null,"code"?: string,"created_at"?: string,"id"?: string,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trials_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    }
                  ]
                },"user_permissions": {
                  Row: {
                    "created_at": string,"id": string,"permission": string,"revoked_at": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"permission": string,"revoked_at"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"permission"?: string,"revoked_at"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_permissions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_roles": {
                  Row: {
                    "created_at": string,"id": string,"revoked_at": string | null,"revoked_reason": string | null,"role": Database["public"]['Enums']["app_role"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"revoked_at"?: string | null,"revoked_reason"?: string | null,"role": Database["public"]['Enums']["app_role"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"revoked_at"?: string | null,"revoked_reason"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_roles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_signature_statement":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"app_error":
{ Args: { "code": string,"params"?: Json }; Returns: undefined
                           },
"assign_site_staff":
{ Args: { "p_reason": string,"p_role": Database["public"]['Enums']["app_role"],"p_site": string,"p_trial": string,"p_user": string }; Returns: string
                           },
"assign_study_manager":
{ Args: { "p_reason": string,"p_trial": string,"p_user": string }; Returns: string
                           },
"audit_attach":
{ Args: { "tbl": unknown }; Returns: undefined
                           },
"audit_compute_hash":
{ Args: { "p_action": string,"p_actor_id": string,"p_actor_role": string,"p_changed": Json,"p_entity_id": string,"p_entity_type": string,"p_id": number,"p_occurred_at": string,"p_prev_hash": string,"p_reason": string }; Returns: string
                           },
"audit_ensure_partition":
{ Args: { "month_start": string }; Returns: undefined
                           },
"audit_store_daily_root":
{ Args: { "p_day"?: string }; Returns: undefined
                           },
"audit_verify_chain":
{ Args: { "from_id"?: number }; Returns: {
              "checked": number,"first_break_id": number,"ok": boolean
            }[]
                           },
"audit_write":
{ Args: { "p_action": string,"p_changed": Json,"p_entity_id": string,"p_entity_type": string,"p_reason"?: string,"p_reason_code"?: string,"p_scope"?: Json,"p_signature_id"?: string,"p_source"?: string }; Returns: number
                           },
"begin_signed_action":
{ Args: { "p_action": string,"p_reason": string,"p_sig": string }; Returns: undefined
                           },
"can_view_profile":
{ Args: { "target": string,"uid": string }; Returns: boolean
                           },
"create_signature":
{ Args: { "p_action": string,"p_meaning"?: string,"p_record_id": string,"p_record_type": string,"p_signature_id"?: string }; Returns: string
                           },
"create_staff_user":
{ Args: { "p_email": string,"p_full_name": string,"p_reason": string,"p_role": Database["public"]['Enums']["app_role"],"p_site"?: string,"p_trial"?: string }; Returns: Json
                           },
"current_aal":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"effective_mfa_policy":
{ Args: { "uid": string }; Returns: Database["public"]['Enums']["mfa_policy"]
                           },
"end_signed_action":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"get_catalogue":
{ Args: { "lang": string }; Returns: Json
                           },
"grant_role":
{ Args: { "p_reason": string,"p_role": Database["public"]['Enums']["app_role"],"p_user": string }; Returns: string
                           },
"has_role":
{ Args: { "r": Database["public"]['Enums']["app_role"],"uid": string }; Returns: boolean
                           },
"is_admin":
{ Args: { "uid": string }; Returns: boolean
                           },
"is_staff":
{ Args: { "uid": string }; Returns: boolean
                           },
"is_translator":
{ Args: { "uid": string }; Returns: boolean
                           },
"list_published_languages":
{ Args: Record<PropertyKey, never>; Returns: {
              "code": string,"english_name": string,"is_default": boolean,"native_name": string
            }[]
                           },
"log_export":
{ Args: { "p_details"?: Json,"p_list": string,"p_rows": number }; Returns: undefined
                           },
"log_signature_attempt":
{ Args: { "p_outcome": string,"p_reason"?: string }; Returns: undefined
                           },
"manages_participant":
{ Args: { "participant": string,"uid": string }; Returns: boolean
                           },
"manages_site":
{ Args: { "site": string,"uid": string }; Returns: boolean
                           },
"manages_trial":
{ Args: { "trial": string,"uid": string }; Returns: boolean
                           },
"mfa_policy_rank":
{ Args: { "p": Database["public"]['Enums']["mfa_policy"] }; Returns: number
                           },
"mfa_satisfied":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"my_security_state":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"password_changed":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"require_actor":
{ Args: { "p_admin_only"?: boolean }; Returns: string
                           },
"reset_user_mfa":
{ Args: { "p_reason": string,"p_user": string }; Returns: undefined
                           },
"revoke_assignment":
{ Args: { "p_id": string,"p_kind": string,"p_reason": string }; Returns: undefined
                           },
"revoke_role":
{ Args: { "p_reason": string,"p_user_role": string }; Returns: undefined
                           },
"set_user_status":
{ Args: { "p_reason": string,"p_status": string,"p_user": string }; Returns: undefined
                           },
"signable_snapshot":
{ Args: { "p_id": string,"p_type": string }; Returns: Json
                           },
"signature_reauth_method":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"signature_required":
{ Args: { "p_action": string }; Returns: boolean
                           },
"signatures_for":
{ Args: { "p_id": string,"p_type": string }; Returns: {
              "full_name": string,"id": string,"is_current": boolean,"meaning": string,"record_version": number,"role_title": string,"signed_at": string
            }[]
                           },
"snapshot_hash":
{ Args: { "p_id": string,"p_type": string }; Returns: string
                           },
"works_on_trial":
{ Args: { "trial": string,"uid": string }; Returns: boolean
                           }
          }
          Enums: {
            "app_role": "admin"|"study_manager"|"site_manager"|"crc"|"finance"|"participant"|"auditor"|"sponsor","mfa_policy": "off"|"optional"|"required"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "app_role": ["admin", "study_manager", "site_manager", "crc", "finance", "participant", "auditor", "sponsor"],"mfa_policy": ["off", "optional", "required"]
          }
        }
} as const
