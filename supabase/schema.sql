-- Supabase Database Schema for Retro/Modern Video Game Collection & Trophy Tracker

-- 1. Create PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  favorite_console TEXT DEFAULT '',
  settings JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create GAMES Table
CREATE TABLE IF NOT EXISTS public.games (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  genre TEXT DEFAULT '',
  platforms JSONB DEFAULT '[]'::jsonb,
  release_date TEXT DEFAULT '',
  barcode TEXT DEFAULT '',
  acquisition_date TEXT DEFAULT '',
  rating NUMERIC DEFAULT 0,
  play_time NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Pendiente',
  favorite BOOLEAN DEFAULT FALSE,
  cover_color TEXT DEFAULT '#171717',
  cover_symbol TEXT DEFAULT 'gamepad',
  cover_image TEXT DEFAULT '',
  igdb_id INT,
  igdb_rating NUMERIC,
  igdb_url TEXT,
  steam_app_id INT,
  achievements JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SQL statements to execute if updating an existing database table:
-- ALTER TABLE public.games ADD COLUMN IF NOT EXISTS favorite BOOLEAN DEFAULT FALSE;
-- ALTER TABLE public.games ADD COLUMN IF NOT EXISTS steam_app_id INT;

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR PROFILES
CREATE POLICY "Users can view public profiles" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 5. RLS POLICIES FOR GAMES
CREATE POLICY "Users can view their own games" 
  ON public.games FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own games" 
  ON public.games FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own games" 
  ON public.games FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own games" 
  ON public.games FOR DELETE 
  USING (auth.uid() = user_id);

-- 6. PROFILE CREATION TRIGGER ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
