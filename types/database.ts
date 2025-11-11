export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TicketStatus = 'waiting' | 'serving' | 'done' | 'skipped' | 'cancelled';

export type UserRole = 'admin' | 'supervisor' | 'staff' | 'kiosk' | 'display';

export type DeploymentMode = 'hybrid' | 'cloud_only' | 'local_only';

export interface Database {
  public: {
    Tables: {
      tickets: {
        Row: {
          id: string;
          ticket_number: string;
          service_id: string;
          status: TicketStatus;
          priority_level: number;
          counter_id: string | null;
          kiosk_id: string | null;
          created_at: string;
          started_at: string | null;
          ended_at: string | null;
          notes: string | null;
          issued_by: string;
          synced: boolean;
          branch_id: string;
        };
        Insert: {
          id?: string;
          ticket_number: string;
          service_id: string;
          status?: TicketStatus;
          priority_level?: number;
          counter_id?: string | null;
          kiosk_id?: string | null;
          created_at?: string;
          started_at?: string | null;
          ended_at?: string | null;
          notes?: string | null;
          issued_by: string;
          synced?: boolean;
          branch_id: string;
        };
        Update: {
          id?: string;
          ticket_number?: string;
          service_id?: string;
          status?: TicketStatus;
          priority_level?: number;
          counter_id?: string | null;
          kiosk_id?: string | null;
          created_at?: string;
          started_at?: string | null;
          ended_at?: string | null;
          notes?: string | null;
          issued_by?: string;
          synced?: boolean;
          branch_id?: string;
        };
      };
      counters: {
        Row: {
          id: string;
          name: string;
          branch_id: string;
          staff_id: string | null;
          is_active: boolean;
          last_ping: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          branch_id: string;
          staff_id?: string | null;
          is_active?: boolean;
          last_ping?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          branch_id?: string;
          staff_id?: string | null;
          is_active?: boolean;
          last_ping?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          name: string;
          prefix: string;
          avg_service_time: number;
          branch_id: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          prefix: string;
          avg_service_time?: number;
          branch_id: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          prefix?: string;
          avg_service_time?: number;
          branch_id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: UserRole;
          branch_id: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          role: UserRole;
          branch_id: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: UserRole;
          branch_id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      branches: {
        Row: {
          id: string;
          name: string;
          mode: DeploymentMode;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          mode?: DeploymentMode;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          mode?: DeploymentMode;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_next_ticket: {
        Args: {
          p_service_id: string;
          p_counter_id: string;
        };
        Returns: string | null;
      };
    };
    Enums: {
      ticket_status: TicketStatus;
      user_role: UserRole;
      deployment_mode: DeploymentMode;
    };
  };
}