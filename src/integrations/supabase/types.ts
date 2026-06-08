export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_trail: {
        Row: {
          action: string
          created_at: string
          id: string
          organization_id: string | null
          payload: Json
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          organization_id?: string | null
          payload?: Json
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          payload?: Json
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_announcements: {
        Row: {
          announcement_type: string
          content: string
          created_at: string
          created_by: string | null
          event_id: string
          expires_at: string | null
          id: string
          is_pinned: boolean
          published_at: string
          title: string
          updated_at: string
        }
        Insert: {
          announcement_type?: string
          content: string
          created_at?: string
          created_by?: string | null
          event_id: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          published_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          announcement_type?: string
          content?: string
          created_at?: string
          created_by?: string | null
          event_id?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          published_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_announcements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_conversations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          participant_a: string
          participant_b: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          participant_a: string
          participant_b: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          participant_a?: string
          participant_b?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_conversations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_conversations_participant_a_fkey"
            columns: ["participant_a"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_conversations_participant_b_fkey"
            columns: ["participant_b"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_meetings: {
        Row: {
          created_at: string
          event_id: string
          id: string
          message: string | null
          proposed_location: string | null
          proposed_time: string | null
          recipient_id: string
          requester_id: string
          responded_at: string | null
          response_message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          message?: string | null
          proposed_location?: string | null
          proposed_time?: string | null
          recipient_id: string
          requester_id: string
          responded_at?: string | null
          response_message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          message?: string | null
          proposed_location?: string | null
          proposed_time?: string | null
          recipient_id?: string
          requester_id?: string
          responded_at?: string | null
          response_message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_meetings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_meetings_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_meetings_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "event_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          bio: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          country: string | null
          created_at: string
          email: string
          event_id: string
          full_name: string
          id: string
          interests: string[] | null
          is_visible_in_directory: boolean
          linkedin_url: string | null
          organization: string | null
          participant_category: string
          phone: string | null
          photo_url: string | null
          position: string | null
          qr_token: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          country?: string | null
          created_at?: string
          email: string
          event_id: string
          full_name: string
          id?: string
          interests?: string[] | null
          is_visible_in_directory?: boolean
          linkedin_url?: string | null
          organization?: string | null
          participant_category?: string
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          qr_token?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          country?: string | null
          created_at?: string
          email?: string
          event_id?: string
          full_name?: string
          id?: string
          interests?: string[] | null
          is_visible_in_directory?: boolean
          linkedin_url?: string | null
          organization?: string | null
          participant_category?: string
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          qr_token?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_session_speakers: {
        Row: {
          created_at: string
          role: string | null
          session_id: string
          sort_order: number
          speaker_id: string
        }
        Insert: {
          created_at?: string
          role?: string | null
          session_id: string
          sort_order?: number
          speaker_id: string
        }
        Update: {
          created_at?: string
          role?: string | null
          session_id?: string
          sort_order?: number
          speaker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_session_speakers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "event_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_session_speakers_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "event_speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sessions: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          ends_at: string
          event_id: string
          id: string
          location: string | null
          session_type: string
          sort_order: number
          starts_at: string
          title: string
          track: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          ends_at: string
          event_id: string
          id?: string
          location?: string | null
          session_type?: string
          sort_order?: number
          starts_at: string
          title: string
          track?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          ends_at?: string
          event_id?: string
          id?: string
          location?: string | null
          session_type?: string
          sort_order?: number
          starts_at?: string
          title?: string
          track?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_speakers: {
        Row: {
          bio: string | null
          created_at: string
          event_id: string
          full_name: string
          id: string
          linkedin_url: string | null
          organization: string | null
          photo_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          event_id: string
          full_name: string
          id?: string
          linkedin_url?: string | null
          organization?: string | null
          photo_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          event_id?: string
          full_name?: string
          id?: string
          linkedin_url?: string | null
          organization?: string | null
          photo_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_speakers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          location: string | null
          name: string
          organization_id: string
          slug: string
          starts_at: string
          status: string
          updated_at: string
          wifi_encryption: string | null
          wifi_password: string | null
          wifi_ssid: string | null
        }
        Insert: {
          capacity?: number | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          id?: string
          location?: string | null
          name: string
          organization_id: string
          slug: string
          starts_at: string
          status?: string
          updated_at?: string
          wifi_encryption?: string | null
          wifi_password?: string | null
          wifi_ssid?: string | null
        }
        Update: {
          capacity?: number | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          location?: string | null
          name?: string
          organization_id?: string
          slug?: string
          starts_at?: string
          status?: string
          updated_at?: string
          wifi_encryption?: string | null
          wifi_password?: string | null
          wifi_ssid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      live_poll_votes: {
        Row: {
          answer: Json
          created_at: string
          id: string
          participant_id: string | null
          poll_id: string
        }
        Insert: {
          answer: Json
          created_at?: string
          id?: string
          participant_id?: string | null
          poll_id: string
        }
        Update: {
          answer?: Json
          created_at?: string
          id?: string
          participant_id?: string | null
          poll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "live_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      live_polls: {
        Row: {
          closed_at: string | null
          created_at: string
          id: string
          is_active: boolean
          options: Json
          poll_type: string
          question: string
          session_id: string
          show_results: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          options?: Json
          poll_type?: string
          question: string
          session_id: string
          show_results?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          options?: Json
          poll_type?: string
          question?: string
          session_id?: string
          show_results?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_polls_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "event_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          source: string | null
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          source?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_outbox: {
        Row: {
          attempts: number
          channel: string
          created_at: string
          event_id: string | null
          id: string
          idempotency_key: string
          last_error: string | null
          payload: Json
          purpose: string
          recipient: string
          registration_id: string | null
          scheduled_for: string
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          channel: string
          created_at?: string
          event_id?: string | null
          id?: string
          idempotency_key: string
          last_error?: string | null
          payload?: Json
          purpose: string
          recipient: string
          registration_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          channel?: string
          created_at?: string
          event_id?: string | null
          id?: string
          idempotency_key?: string
          last_error?: string | null
          payload?: Json
          purpose?: string
          recipient?: string
          registration_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_outbox_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_outbox_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          organization_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_runs: {
        Row: {
          ddl_commands: string[] | null
          generated_at: string
          id: string
          report: Json
          total_issues: number
          trigger_source: string
        }
        Insert: {
          ddl_commands?: string[] | null
          generated_at?: string
          id?: string
          report: Json
          total_issues: number
          trigger_source?: string
        }
        Update: {
          ddl_commands?: string[] | null
          generated_at?: string
          id?: string
          report?: Json
          total_issues?: number
          trigger_source?: string
        }
        Relationships: []
      }
      session_attendance: {
        Row: {
          created_at: string
          id: string
          participant_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "event_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_bookmarks: {
        Row: {
          created_at: string
          id: string
          participant_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_bookmarks_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_bookmarks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "event_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_bootstrap_emails: {
        Row: {
          created_at: string
          email: string
          note: string | null
        }
        Insert: {
          created_at?: string
          email: string
          note?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          note?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _reg_from_token: { Args: { p_qr_token: string }; Returns: string }
      _security_audit_compute: { Args: never; Returns: Json }
      cancel_my_meeting: {
        Args: { p_meeting_id: string; p_qr_token: string }
        Returns: undefined
      }
      cast_poll_vote: {
        Args: { p_answer: Json; p_poll_id: string; p_qr_token: string }
        Returns: Json
      }
      check_in_registration: {
        Args: { p_qr_token: string }
        Returns: {
          already_checked_in: boolean
          checked_at: string
          email: string
          event_id: string
          event_name: string
          full_name: string
          job_position: string
          organization: string
          reg_status: string
          registration_id: string
        }[]
      }
      claim_first_admin: { Args: never; Returns: boolean }
      create_meeting_request: {
        Args: {
          p_message?: string
          p_proposed_location?: string
          p_proposed_time?: string
          p_qr_token: string
          p_recipient_id: string
        }
        Returns: string
      }
      current_user_org: { Args: never; Returns: string }
      event_org: { Args: { _event_id: string }; Returns: string }
      get_event_wifi: {
        Args: { p_event_id: string }
        Returns: {
          wifi_encryption: string
          wifi_password: string
          wifi_ssid: string
        }[]
      }
      get_match_recommendations: {
        Args: {
          p_event_id: string
          p_limit?: number
          p_registration_id: string
        }
        Returns: {
          bio: string
          country: string
          full_name: string
          id: string
          interests: string[]
          job_title: string
          linkedin_url: string
          match_score: number
          organization: string
          participant_category: string
          photo_url: string
        }[]
      }
      get_or_create_conversation: {
        Args: {
          p_event_id: string
          p_participant_a: string
          p_participant_b: string
        }
        Returns: string
      }
      get_participant_public: {
        Args: { p_id: string }
        Returns: {
          full_name: string
          id: string
          organization: string
          participant_category: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_conversation_messages: {
        Args: { p_conversation_id: string; p_qr_token: string }
        Returns: {
          content: string
          created_at: string
          id: string
          read_at: string
          sender_id: string
        }[]
      }
      list_event_directory: {
        Args: { p_category?: string; p_event_id: string }
        Returns: {
          bio: string
          country: string
          full_name: string
          id: string
          interests: string[]
          linkedin_url: string
          organization: string
          participant_category: string
          photo_url: string
          position: string
        }[]
      }
      list_my_bookmarks: {
        Args: { p_event_id: string; p_qr_token: string }
        Returns: {
          session_id: string
        }[]
      }
      list_my_conversations: {
        Args: { p_qr_token: string }
        Returns: {
          conversation_id: string
          last_at: string
          last_message: string
          other_category: string
          other_id: string
          other_name: string
          other_organization: string
          unread_count: number
        }[]
      }
      list_my_meetings: {
        Args: { p_qr_token: string }
        Returns: {
          created_at: string
          event_id: string
          id: string
          message: string
          proposed_location: string
          proposed_time: string
          recipient_id: string
          recipient_name: string
          recipient_org: string
          requester_id: string
          requester_name: string
          requester_org: string
          responded_at: string
          response_message: string
          status: string
        }[]
      }
      list_my_sent_meeting_recipients: {
        Args: { p_qr_token: string }
        Returns: {
          recipient_id: string
        }[]
      }
      mark_conversation_read: {
        Args: { p_conversation_id: string; p_qr_token: string }
        Returns: undefined
      }
      me_registration: {
        Args: { p_qr_token: string }
        Returns: {
          bio: string
          country: string
          email: string
          event_id: string
          full_name: string
          id: string
          interests: string[]
          is_visible_in_directory: boolean
          job_position: string
          linkedin_url: string
          organization: string
          participant_category: string
          phone: string
          photo_url: string
          status: string
        }[]
      }
      record_session_attendance: {
        Args: { p_qr_token: string; p_session_id: string }
        Returns: Json
      }
      register_for_event: {
        Args: {
          p_email: string
          p_event_id: string
          p_full_name: string
          p_organization: string
          p_phone: string
          p_position: string
        }
        Returns: string
      }
      respond_to_meeting: {
        Args: {
          p_meeting_id: string
          p_qr_token: string
          p_response_message?: string
          p_status: string
        }
        Returns: undefined
      }
      run_security_audit: { Args: never; Returns: Json }
      send_conversation_message: {
        Args: {
          p_content: string
          p_conversation_id: string
          p_qr_token: string
        }
        Returns: string
      }
      start_conversation: {
        Args: { p_other_participant_id: string; p_qr_token: string }
        Returns: string
      }
      super_admin_exists: { Args: never; Returns: boolean }
      toggle_my_bookmark: {
        Args: { p_add: boolean; p_qr_token: string; p_session_id: string }
        Returns: undefined
      }
      update_my_profile: {
        Args: {
          p_bio?: string
          p_country?: string
          p_interests?: string[]
          p_is_visible_in_directory?: boolean
          p_linkedin_url?: string
          p_participant_category?: string
          p_photo_url?: string
          p_qr_token: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "org_admin"
        | "staff"
        | "sponsor"
        | "participant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "org_admin", "staff", "sponsor", "participant"],
    },
  },
} as const
