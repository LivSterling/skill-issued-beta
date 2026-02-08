-- Migration: Create games and user_games tables
-- Description: Stores RAWG.io game data and user-specific game library data
-- Author: Generated from tasks-pdr-rawg-api-intergration.md schema
-- Date: 2026-02-07

-- Create games table for storing RAWG.io API game data
CREATE TABLE IF NOT EXISTS public.games (
  id INTEGER PRIMARY KEY, -- RAWG.io game ID
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  released DATE,
  background_image TEXT,
  rating DECIMAL(3,2),
  rating_top INTEGER,
  ratings_count INTEGER,
  metacritic INTEGER,
  playtime INTEGER, -- average playtime in hours
  genres JSONB, -- array of genre objects
  platforms JSONB, -- array of platform objects
  developers JSONB, -- array of developer objects
  publishers JSONB, -- array of publisher objects
  esrb_rating JSONB, -- ESRB rating object
  tags JSONB, -- array of tag objects
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_games_name ON public.games (name);
CREATE INDEX IF NOT EXISTS idx_games_rating ON public.games (rating DESC);
CREATE INDEX IF NOT EXISTS idx_games_released ON public.games (released DESC);
CREATE INDEX IF NOT EXISTS idx_games_slug ON public.games (slug);

-- Create user_games table for user-specific game library data
CREATE TABLE IF NOT EXISTS public.user_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('want_to_play', 'playing', 'completed', 'dropped', 'on_hold')),
  user_rating DECIMAL(2,1) CHECK (user_rating >= 0 AND user_rating <= 5),
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  hours_played INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  review TEXT,
  is_favorite BOOLEAN DEFAULT false,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- Create indexes for user_games queries
CREATE INDEX IF NOT EXISTS idx_user_games_user_id ON public.user_games (user_id);
CREATE INDEX IF NOT EXISTS idx_user_games_game_id ON public.user_games (game_id);
CREATE INDEX IF NOT EXISTS idx_user_games_status ON public.user_games (status);
CREATE INDEX IF NOT EXISTS idx_user_games_updated_at ON public.user_games (updated_at DESC);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for games table
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for user_games table
CREATE TRIGGER update_user_games_updated_at
  BEFORE UPDATE ON public.user_games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;

-- RLS Policies for games table (read-only for all authenticated users)
CREATE POLICY "Games are viewable by all authenticated users"
  ON public.games
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_games table (users can only access their own data)
CREATE POLICY "Users can view their own game data"
  ON public.user_games
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game data"
  ON public.user_games
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game data"
  ON public.user_games
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own game data"
  ON public.user_games
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.games TO authenticated;
GRANT ALL ON public.user_games TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
