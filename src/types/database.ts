export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          full_name: string | null
          role: 'owner' | 'member' | 'admin'
          organization_id: string | null
        }
        Insert: {
          id: string
          created_at?: string
          full_name?: string | null
          role?: 'owner' | 'member' | 'admin'
          organization_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          full_name?: string | null
          role?: 'owner' | 'member' | 'admin'
          organization_id?: string | null
        }
      }
      organizations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          slug: string
          industry: string
          description: string | null
          email: string | null
          phone: string | null
          website: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          country: string
          business_hours: Json | null
          service_areas: string[] | null
          services_offered: string[] | null
          timezone: string
          logo_url: string | null
          primary_color: string
          billing_customer_id: string | null
          plan: 'starter' | 'growth' | 'pro' | null
          notification_phone: string | null
          notification_settings: Json | null
          onboarding_completed: boolean
          onboarding_data: Json | null
          setup_status: 'pending' | 'in_review' | 'setting_up' | 'testing' | 'ready' | 'active'
          setup_notes: string | null
          setup_updated_at: string | null
          billable_calls_this_month: number
          billing_period_month: number
          billing_period_year: number
          trial_started_at: string | null
          trial_ends_at: string | null
          trial_used: boolean
          trial_plan: string | null
          setup_fee_refunded: boolean
          setup_fee_refunded_at: string | null
          account_credit: number
          setup_fee_credited: boolean
          setup_fee_credited_at: string | null
          subscription_started_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          slug: string
          industry?: string
          description?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string
          business_hours?: Json | null
          service_areas?: string[] | null
          services_offered?: string[] | null
          timezone?: string
          logo_url?: string | null
          primary_color?: string
          billing_customer_id?: string | null
          plan?: 'starter' | 'growth' | 'pro' | null
          notification_phone?: string | null
          notification_settings?: Json | null
          onboarding_completed?: boolean
          onboarding_data?: Json | null
          setup_status?: 'pending' | 'in_review' | 'setting_up' | 'testing' | 'ready' | 'active'
          setup_notes?: string | null
          setup_updated_at?: string | null
          billable_calls_this_month?: number
          billing_period_month?: number
          billing_period_year?: number
          trial_started_at?: string | null
          trial_ends_at?: string | null
          trial_used?: boolean
          trial_plan?: string | null
          setup_fee_refunded?: boolean
          setup_fee_refunded_at?: string | null
          account_credit?: number
          setup_fee_credited?: boolean
          setup_fee_credited_at?: string | null
          subscription_started_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          slug?: string
          industry?: string
          description?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string
          business_hours?: Json | null
          service_areas?: string[] | null
          services_offered?: string[] | null
          timezone?: string
          logo_url?: string | null
          primary_color?: string
          billing_customer_id?: string | null
          plan?: 'starter' | 'growth' | 'pro' | null
          notification_phone?: string | null
          notification_settings?: Json | null
          onboarding_completed?: boolean
          onboarding_data?: Json | null
          setup_status?: 'pending' | 'in_review' | 'setting_up' | 'testing' | 'ready' | 'active'
          setup_notes?: string | null
          setup_updated_at?: string | null
          billable_calls_this_month?: number
          billing_period_month?: number
          billing_period_year?: number
          trial_started_at?: string | null
          trial_ends_at?: string | null
          trial_used?: boolean
          trial_plan?: string | null
          setup_fee_refunded?: boolean
          setup_fee_refunded_at?: string | null
          account_credit?: number
          setup_fee_credited?: boolean
          setup_fee_credited_at?: string | null
          subscription_started_at?: string | null
        }
      }
      organization_members: {
        Row: {
          id: string
          created_at: string
          organization_id: string
          profile_id: string
          role: 'owner' | 'admin' | 'member'
        }
        Insert: {
          id?: string
          created_at?: string
          organization_id: string
          profile_id: string
          role: 'owner' | 'admin' | 'member'
        }
        Update: {
          id?: string
          created_at?: string
          organization_id?: string
          profile_id?: string
          role?: 'owner' | 'admin' | 'member'
        }
      }
      vapi_configs: {
        Row: {
          id: string
          created_at: string
          organization_id: string
          vapi_api_key: string | null
          inbound_agent_id: string | null
          outbound_agent_id: string | null
          inbound_phone_number: string | null
          outbound_phone_number: string | null
          webhook_secret: string | null
          active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          organization_id: string
          vapi_api_key?: string | null
          inbound_agent_id?: string | null
          outbound_agent_id?: string | null
          inbound_phone_number?: string | null
          outbound_phone_number?: string | null
          webhook_secret?: string | null
          active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          organization_id?: string
          vapi_api_key?: string | null
          inbound_agent_id?: string | null
          outbound_agent_id?: string | null
          inbound_phone_number?: string | null
          outbound_phone_number?: string | null
          webhook_secret?: string | null
          active?: boolean
        }
      }
      leads: {
        Row: {
          id: string
          created_at: string
          organization_id: string
          name: string | null
          phone: string | null
          email: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          property_type: 'residential' | 'commercial' | 'unknown' | null
          service_type: string | null
          status: 'new' | 'interested' | 'not_interested' | 'call_back' | 'booked' | 'customer'
          notes: string | null
          source: 'inbound' | 'manual' | 'campaign'
          score: number
          score_factors: Json | null
          last_scored_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          organization_id: string
          name?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          property_type?: 'residential' | 'commercial' | 'unknown' | null
          service_type?: string | null
          status?: 'new' | 'interested' | 'not_interested' | 'call_back' | 'booked' | 'customer'
          notes?: string | null
          source?: 'inbound' | 'manual' | 'campaign'
          score?: number
          score_factors?: Json | null
          last_scored_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          organization_id?: string
          name?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          property_type?: 'residential' | 'commercial' | 'unknown' | null
          service_type?: string | null
          status?: 'new' | 'interested' | 'not_interested' | 'call_back' | 'booked' | 'customer'
          notes?: string | null
          source?: 'inbound' | 'manual' | 'campaign'
          score?: number
          score_factors?: Json | null
          last_scored_at?: string | null
        }
      }
      calls: {
        Row: {
          id: string
          created_at: string
          organization_id: string
          lead_id: string | null
          direction: 'inbound' | 'outbound'
          provider_call_id: string | null
          from_number: string | null
          to_number: string | null
          status: 'queued' | 'ringing' | 'answered' | 'completed' | 'failed' | 'voicemail'
          duration_seconds: number | null
          recording_url: string | null
          transcript: string | null
          summary: string | null
          raw_payload: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          organization_id: string
          lead_id?: string | null
          direction: 'inbound' | 'outbound'
          provider_call_id?: string | null
          from_number?: string | null
          to_number?: string | null
          status?: 'queued' | 'ringing' | 'answered' | 'completed' | 'failed' | 'voicemail'
          duration_seconds?: number | null
          recording_url?: string | null
          transcript?: string | null
          summary?: string | null
          raw_payload?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          organization_id?: string
          lead_id?: string | null
          direction?: 'inbound' | 'outbound'
          provider_call_id?: string | null
          from_number?: string | null
          to_number?: string | null
          status?: 'queued' | 'ringing' | 'answered' | 'completed' | 'failed' | 'voicemail'
          duration_seconds?: number | null
          recording_url?: string | null
          transcript?: string | null
          summary?: string | null
          raw_payload?: Json | null
        }
      }
      appointments: {
        Row: {
          id: string
          created_at: string
          organization_id: string
          lead_id: string
          title: string
          start_time: string
          end_time: string
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          organization_id: string
          lead_id: string
          title: string
          start_time: string
          end_time: string
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          organization_id?: string
          lead_id?: string
          title?: string
          start_time?: string
          end_time?: string
          notes?: string | null
        }
      }
      phone_numbers: {
        Row: {
          id: string
          created_at: string
          organization_id: string
          phone_number: string
          provider_phone_id: string | null
          friendly_name: string | null
          type: 'inbound' | 'outbound' | 'both'
          daily_limit: number
          calls_today: number
          last_reset_date: string
          active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          organization_id: string
          phone_number: string
          provider_phone_id?: string | null
          friendly_name?: string | null
          type?: 'inbound' | 'outbound' | 'both'
          daily_limit?: number
          calls_today?: number
          last_reset_date?: string
          active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          organization_id?: string
          phone_number?: string
          provider_phone_id?: string | null
          friendly_name?: string | null
          type?: 'inbound' | 'outbound' | 'both'
          daily_limit?: number
          calls_today?: number
          last_reset_date?: string
          active?: boolean
        }
      }
      call_limits: {
        Row: {
          id: string
          organization_id: string
          lead_id: string
          phone_number_id: string | null
          calls_today: number
          last_call_at: string | null
          last_reset_date: string
        }
        Insert: {
          id?: string
          organization_id: string
          lead_id: string
          phone_number_id?: string | null
          calls_today?: number
          last_call_at?: string | null
          last_reset_date?: string
        }
        Update: {
          id?: string
          organization_id?: string
          lead_id?: string
          phone_number_id?: string | null
          calls_today?: number
          last_call_at?: string | null
          last_reset_date?: string
        }
      }
      agent_configs: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          organization_id: string
          inbound_agent_id: string | null
          inbound_phone_number_id: string | null
          inbound_enabled: boolean
          inbound_greeting: string | null
          outbound_agent_id: string | null
          outbound_enabled: boolean
          outbound_script_type: string
          schedule: Json
          daily_call_limit: number
          calls_made_today: number
          last_reset_date: string
          custom_business_name: string | null
          custom_service_area: string | null
          custom_greeting: string | null
          custom_variables: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          organization_id: string
          inbound_agent_id?: string | null
          inbound_phone_number_id?: string | null
          inbound_enabled?: boolean
          inbound_greeting?: string | null
          outbound_agent_id?: string | null
          outbound_enabled?: boolean
          outbound_script_type?: string
          schedule?: Json
          daily_call_limit?: number
          calls_made_today?: number
          last_reset_date?: string
          custom_business_name?: string | null
          custom_service_area?: string | null
          custom_greeting?: string | null
          custom_variables?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          organization_id?: string
          inbound_agent_id?: string | null
          inbound_phone_number_id?: string | null
          inbound_enabled?: boolean
          inbound_greeting?: string | null
          outbound_agent_id?: string | null
          outbound_enabled?: boolean
          outbound_script_type?: string
          schedule?: Json
          daily_call_limit?: number
          calls_made_today?: number
          last_reset_date?: string
          custom_business_name?: string | null
          custom_service_area?: string | null
          custom_greeting?: string | null
          custom_variables?: Json | null
        }
      }
      campaigns: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          organization_id: string
          name: string
          description: string | null
          script_type: string
          phone_number_id: string | null
          status: 'draft' | 'active' | 'paused' | 'completed'
          schedule: Json
          daily_limit: number
          total_contacts: number
          contacts_called: number
          contacts_answered: number
          contacts_interested: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          organization_id: string
          name: string
          description?: string | null
          script_type?: string
          phone_number_id?: string | null
          status?: 'draft' | 'active' | 'paused' | 'completed'
          schedule?: Json
          daily_limit?: number
          total_contacts?: number
          contacts_called?: number
          contacts_answered?: number
          contacts_interested?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          organization_id?: string
          name?: string
          description?: string | null
          script_type?: string
          phone_number_id?: string | null
          status?: 'draft' | 'active' | 'paused' | 'completed'
          schedule?: Json
          daily_limit?: number
          total_contacts?: number
          contacts_called?: number
          contacts_answered?: number
          contacts_interested?: number
        }
      }
      campaign_contacts: {
        Row: {
          id: string
          created_at: string
          campaign_id: string
          organization_id: string
          name: string | null
          phone: string
          email: string | null
          business_name: string | null
          address: string | null
          city: string | null
          state: string | null
          notes: string | null
          status: 'pending' | 'queued' | 'calling' | 'no_answer' | 'voicemail' | 'answered' | 'interested' | 'not_interested' | 'callback' | 'wrong_number' | 'do_not_call'
          call_count: number
          last_call_at: string | null
          last_call_duration: number | null
          last_call_summary: string | null
          last_call_transcript: string | null
          converted_lead_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          campaign_id: string
          organization_id: string
          name?: string | null
          phone: string
          email?: string | null
          business_name?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          notes?: string | null
          status?: 'pending' | 'queued' | 'calling' | 'no_answer' | 'voicemail' | 'answered' | 'interested' | 'not_interested' | 'callback' | 'wrong_number' | 'do_not_call'
          call_count?: number
          last_call_at?: string | null
          last_call_duration?: number | null
          last_call_summary?: string | null
          last_call_transcript?: string | null
          converted_lead_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          campaign_id?: string
          organization_id?: string
          name?: string | null
          phone?: string
          email?: string | null
          business_name?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          notes?: string | null
          status?: 'pending' | 'queued' | 'calling' | 'no_answer' | 'voicemail' | 'answered' | 'interested' | 'not_interested' | 'callback' | 'wrong_number' | 'do_not_call'
          call_count?: number
          last_call_at?: string | null
          last_call_duration?: number | null
          last_call_summary?: string | null
          last_call_transcript?: string | null
          converted_lead_id?: string | null
        }
      }
      call_disputes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          organization_id: string
          call_id: string | null
          campaign_contact_id: string | null
          call_date: string
          call_duration: number | null
          call_outcome: string
          phone_number: string | null
          reason: string
          status: 'pending' | 'approved' | 'denied'
          admin_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          credit_refunded: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          organization_id: string
          call_id?: string | null
          campaign_contact_id?: string | null
          call_date: string
          call_duration?: number | null
          call_outcome: string
          phone_number?: string | null
          reason: string
          status?: 'pending' | 'approved' | 'denied'
          admin_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          credit_refunded?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          organization_id?: string
          call_id?: string | null
          campaign_contact_id?: string | null
          call_date?: string
          call_duration?: number | null
          call_outcome?: string
          phone_number?: string | null
          reason?: string
          status?: 'pending' | 'approved' | 'denied'
          admin_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          credit_refunded?: boolean
        }
      }
      tags: {
        Row: {
          id: string
          created_at: string
          organization_id: string
          name: string
          color: string
        }
        Insert: {
          id?: string
          created_at?: string
          organization_id: string
          name: string
          color?: string
        }
        Update: {
          id?: string
          created_at?: string
          organization_id?: string
          name?: string
          color?: string
        }
      }
      lead_tags: {
        Row: {
          id: string
          created_at: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          id?: string
          created_at?: string
          lead_id?: string
          tag_id?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          created_at: string
          organization_id: string
          lead_id: string | null
          campaign_contact_id: string | null
          type: 'call_inbound' | 'call_outbound' | 'call_missed' | 'call_voicemail' | 'lead_created' | 'lead_updated' | 'lead_status_changed' | 'appointment_created' | 'appointment_updated' | 'appointment_cancelled' | 'tag_added' | 'tag_removed' | 'note_added' | 'email_sent' | 'sms_sent' | 'score_updated' | 'converted_from_campaign'
          title: string
          description: string | null
          metadata: Json | null
          actor_id: string | null
          actor_name: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          organization_id: string
          lead_id?: string | null
          campaign_contact_id?: string | null
          type: 'call_inbound' | 'call_outbound' | 'call_missed' | 'call_voicemail' | 'lead_created' | 'lead_updated' | 'lead_status_changed' | 'appointment_created' | 'appointment_updated' | 'appointment_cancelled' | 'tag_added' | 'tag_removed' | 'note_added' | 'email_sent' | 'sms_sent' | 'score_updated' | 'converted_from_campaign'
          title: string
          description?: string | null
          metadata?: Json | null
          actor_id?: string | null
          actor_name?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          organization_id?: string
          lead_id?: string | null
          campaign_contact_id?: string | null
          type?: 'call_inbound' | 'call_outbound' | 'call_missed' | 'call_voicemail' | 'lead_created' | 'lead_updated' | 'lead_status_changed' | 'appointment_created' | 'appointment_updated' | 'appointment_cancelled' | 'tag_added' | 'tag_removed' | 'note_added' | 'email_sent' | 'sms_sent' | 'score_updated' | 'converted_from_campaign'
          title?: string
          description?: string | null
          metadata?: Json | null
          actor_id?: string | null
          actor_name?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          created_at: string
          organization_id: string
          user_id: string | null
          type: 'new_lead' | 'call_completed' | 'appointment_booked' | 'callback_reminder' | 'dispute_resolved' | 'setup_status' | 'usage_warning' | 'system'
          title: string
          message: string
          link: string | null
          read: boolean
          read_at: string | null
          lead_id: string | null
          call_id: string | null
          appointment_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          organization_id: string
          user_id?: string | null
          type: 'new_lead' | 'call_completed' | 'appointment_booked' | 'callback_reminder' | 'dispute_resolved' | 'setup_status' | 'usage_warning' | 'system'
          title: string
          message: string
          link?: string | null
          read?: boolean
          read_at?: string | null
          lead_id?: string | null
          call_id?: string | null
          appointment_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          organization_id?: string
          user_id?: string | null
          type?: 'new_lead' | 'call_completed' | 'appointment_booked' | 'callback_reminder' | 'dispute_resolved' | 'setup_status' | 'usage_warning' | 'system'
          title?: string
          message?: string
          link?: string | null
          read?: boolean
          read_at?: string | null
          lead_id?: string | null
          call_id?: string | null
          appointment_id?: string | null
        }
      }
      follow_up_rules: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          organization_id: string
          name: string
          enabled: boolean
          trigger_status: 'no_answer' | 'voicemail' | 'callback' | 'interested'
          action: 'schedule_call' | 'send_sms' | 'create_task'
          delay_hours: number
          max_attempts: number
          only_during_business_hours: boolean
          message_template: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          organization_id: string
          name: string
          enabled?: boolean
          trigger_status: 'no_answer' | 'voicemail' | 'callback' | 'interested'
          action: 'schedule_call' | 'send_sms' | 'create_task'
          delay_hours?: number
          max_attempts?: number
          only_during_business_hours?: boolean
          message_template?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          organization_id?: string
          name?: string
          enabled?: boolean
          trigger_status?: 'no_answer' | 'voicemail' | 'callback' | 'interested'
          action?: 'schedule_call' | 'send_sms' | 'create_task'
          delay_hours?: number
          max_attempts?: number
          only_during_business_hours?: boolean
          message_template?: string | null
        }
      }
      scheduled_follow_ups: {
        Row: {
          id: string
          created_at: string
          organization_id: string
          rule_id: string | null
          lead_id: string | null
          campaign_contact_id: string | null
          scheduled_for: string
          action: 'schedule_call' | 'send_sms' | 'create_task'
          attempt_number: number
          status: 'pending' | 'completed' | 'cancelled' | 'failed'
          executed_at: string | null
          result: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          organization_id: string
          rule_id?: string | null
          lead_id?: string | null
          campaign_contact_id?: string | null
          scheduled_for: string
          action: 'schedule_call' | 'send_sms' | 'create_task'
          attempt_number?: number
          status?: 'pending' | 'completed' | 'cancelled' | 'failed'
          executed_at?: string | null
          result?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          organization_id?: string
          rule_id?: string | null
          lead_id?: string | null
          campaign_contact_id?: string | null
          scheduled_for?: string
          action?: 'schedule_call' | 'send_sms' | 'create_task'
          attempt_number?: number
          status?: 'pending' | 'completed' | 'cancelled' | 'failed'
          executed_at?: string | null
          result?: string | null
        }
      }
      notes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          organization_id: string
          lead_id: string | null
          campaign_contact_id: string | null
          content: string
          author_id: string | null
          author_name: string | null
          pinned: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          organization_id: string
          lead_id?: string | null
          campaign_contact_id?: string | null
          content: string
          author_id?: string | null
          author_name?: string | null
          pinned?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          organization_id?: string
          lead_id?: string | null
          campaign_contact_id?: string | null
          content?: string
          author_id?: string | null
          author_name?: string | null
          pinned?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

