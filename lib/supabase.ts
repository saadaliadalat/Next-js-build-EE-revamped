import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      balances: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount?: number;
          currency?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          updated_at?: string;
        };
      };
      trades: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          type: 'buy' | 'sell';
          amount: number;
          entry_price: number;
          exit_price: number | null;
          profit_loss: number | null;
          status: 'open' | 'closed';
          opened_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          type: 'buy' | 'sell';
          amount: number;
          entry_price: number;
          exit_price?: number | null;
          profit_loss?: number | null;
          status?: 'open' | 'closed';
          opened_at?: string;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          type?: 'buy' | 'sell';
          amount?: number;
          entry_price?: number;
          exit_price?: number | null;
          profit_loss?: number | null;
          status?: 'open' | 'closed';
          opened_at?: string;
          closed_at?: string | null;
        };
      };
      deposits: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          proof_filename: string | null;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          currency?: string;
          proof_filename?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          proof_filename?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
      };
      withdrawals: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          bank_details: any;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
          processed_at: string | null;
          processed_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          currency?: string;
          bank_details: any;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          processed_at?: string | null;
          processed_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          bank_details?: any;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          processed_at?: string | null;
          processed_by?: string | null;
        };
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          message: string;
          status: 'open' | 'closed';
          priority: 'low' | 'medium' | 'high';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          message: string;
          status?: 'open' | 'closed';
          priority?: 'low' | 'medium' | 'high';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          message?: string;
          status?: 'open' | 'closed';
          priority?: 'low' | 'medium' | 'high';
          created_at?: string;
          updated_at?: string;
        };
      };
      ticket_replies: {
        Row: {
          id: string;
          ticket_id: string;
          user_id: string;
          message: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          user_id: string;
          message: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          user_id?: string;
          message?: string;
          is_admin?: boolean;
          created_at?: string;
        };
      };
    };
  };
};
