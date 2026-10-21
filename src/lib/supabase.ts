import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  (import.meta as any).env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey =
  (import.meta as any).env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

export const isSupabaseConfigured =
  !!(import.meta as any).env.VITE_SUPABASE_URL &&
  !!(import.meta as any).env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string
          full_name: string | null
          role: 'speech_therapist' | 'parent' | null
        }
        Insert: {
          id: string
          updated_at?: string
          full_name?: string | null
          role?: 'speech_therapist' | 'parent' | null
        }
        Update: {
          id?: string
          updated_at?: string
          full_name?: string | null
          role?: 'speech_therapist' | 'parent' | null
        }
      }
      lessons: {
        Row: {
          id: string
          created_at: string
          user_id: string
          title: string
          lexical_theme: string
          difficulty_level: 'low' | 'medium' | 'high'
          raw_json: Json
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          title: string
          lexical_theme: string
          difficulty_level: 'low' | 'medium' | 'high'
          raw_json: Json
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          title?: string
          lexical_theme?: string
          difficulty_level?: 'low' | 'medium' | 'high'
          raw_json?: Json
        }
      }
      student_progress: {
        Row: {
          id: string
          lesson_id: string
          user_id: string
          completed_at: string | null
          score: number | null
          lives_wasted: number | null
        }
        Insert: {
          id?: string
          lesson_id: string
          user_id: string
          completed_at?: string | null
          score?: number | null
          lives_wasted?: number | null
        }
        Update: {
          id?: string
          lesson_id?: string
          user_id?: string
          completed_at?: string | null
          score?: number | null
          lives_wasted?: number | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json }
