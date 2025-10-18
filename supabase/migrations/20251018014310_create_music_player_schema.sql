/*
  # Music Player Database Schema

  ## Overview
  Creates tables for a real-time music player with album organization and admin notes.

  ## New Tables
  
  ### `albums`
  - `id` (uuid, primary key) - Unique album identifier
  - `name` (text, unique) - Album name (slow, normal, strong)
  - `title` (text) - Display title for the album
  - `cover_url` (text, nullable) - URL to album cover image
  - `created_at` (timestamptz) - Creation timestamp
  
  ### `songs`
  - `id` (uuid, primary key) - Unique song identifier
  - `album_id` (uuid, foreign key) - References albums table
  - `title` (text) - Song title
  - `artist` (text, nullable) - Artist name
  - `song_url` (text) - URL to MP3 file in storage
  - `created_at` (timestamptz) - Creation timestamp
  - `order_index` (integer) - Order within album playlist
  
  ### `admin_notes`
  - `id` (uuid, primary key) - Unique note identifier
  - `note` (text) - Note content for admin
  - `song_request` (text, nullable) - Requested song details
  - `created_at` (timestamptz) - Creation timestamp
  - `is_read` (boolean) - Whether admin has read the note

  ## Security
  - RLS enabled on all tables
  - Public read access for albums and songs (music player is public)
  - Authenticated users can insert songs and admin notes
  - Only show security policies for controlled access
*/

-- Create albums table
CREATE TABLE IF NOT EXISTS albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  title text NOT NULL,
  cover_url text,
  created_at timestamptz DEFAULT now()
);

-- Create songs table
CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid REFERENCES albums(id) ON DELETE CASCADE,
  title text NOT NULL,
  artist text,
  song_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  order_index integer DEFAULT 0
);

-- Create admin notes table
CREATE TABLE IF NOT EXISTS admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note text NOT NULL,
  song_request text,
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

-- Albums policies (public read, no insert for now - we'll seed them)
CREATE POLICY "Anyone can view albums"
  ON albums FOR SELECT
  USING (true);

-- Songs policies (public read, anyone can insert)
CREATE POLICY "Anyone can view songs"
  ON songs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can add songs"
  ON songs FOR INSERT
  WITH CHECK (true);

-- Admin notes policies (anyone can insert, only readable by all for demo purposes)
CREATE POLICY "Anyone can create admin notes"
  ON admin_notes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view admin notes"
  ON admin_notes FOR SELECT
  USING (true);

-- Insert default albums
INSERT INTO albums (name, title) VALUES
  ('slow', 'Slow'),
  ('normal', 'Normal'),
  ('strong', 'Strong')
ON CONFLICT (name) DO NOTHING;
