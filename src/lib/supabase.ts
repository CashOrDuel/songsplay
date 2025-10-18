import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Album = {
  id: string;
  name: string;
  title: string;
  cover_url: string | null;
  created_at: string;
};

export type Song = {
  id: string;
  album_id: string;
  title: string;
  artist: string | null;
  song_url: string;
  created_at: string;
  order_index: number;
};

export type AdminNote = {
  id: string;
  note: string;
  song_request: string | null;
  created_at: string;
  is_read: boolean;
};
