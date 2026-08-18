-- ==============================================================================
-- SUPABASE COMPLETE DATABASE SCHEMA (FROM SCRATCH)
-- Track Your Games (TYG) - Video Game Library, Trophies & Friends System
-- Run this single script in your Supabase SQL Editor to initialize everything.
-- ==============================================================================

-- 1. Create PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  favorite_console TEXT DEFAULT '',
  language TEXT DEFAULT 'es',
  theme TEXT DEFAULT 'dark',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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

-- 3. Create FRIENDSHIPS Table
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_friendship UNIQUE (sender_id, receiver_id),
  CONSTRAINT different_users CHECK (sender_id <> receiver_id)
);

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_games_user_id ON public.games (user_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games (status);
CREATE INDEX IF NOT EXISTS idx_friendships_sender ON public.friendships (sender_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_receiver ON public.friendships (receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- 6. Clean and Recreate RLS POLICIES FOR PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Allow authenticated users to view profiles (for friend search & community)
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  TO authenticated
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id);

-- 7. Clean and Recreate RLS POLICIES FOR GAMES
DROP POLICY IF EXISTS "Users can view their own games" ON public.games;
DROP POLICY IF EXISTS "Users can view their own games or friends games" ON public.games;
DROP POLICY IF EXISTS "Users can insert their own games" ON public.games;
DROP POLICY IF EXISTS "Users can update their own games" ON public.games;
DROP POLICY IF EXISTS "Users can delete their own games" ON public.games;

-- Allow users to view their own games OR accepted friends' games
CREATE POLICY "Users can view their own games or friends games" 
  ON public.games FOR SELECT 
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.friendships
      WHERE status = 'accepted'
        AND (
          (sender_id = auth.uid() AND receiver_id = public.games.user_id)
          OR (receiver_id = auth.uid() AND sender_id = public.games.user_id)
        )
    )
  );

CREATE POLICY "Users can insert their own games" 
  ON public.games FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own games" 
  ON public.games FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own games" 
  ON public.games FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- 8. Clean and Recreate RLS POLICIES FOR FRIENDSHIPS
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can update their friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;

CREATE POLICY "Users can view their friendships" 
  ON public.friendships FOR SELECT 
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests" 
  ON public.friendships FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their friendships" 
  ON public.friendships FOR UPDATE 
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can delete their friendships" 
  ON public.friendships FOR DELETE 
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 9. AUTOMATIC PROFILE CREATION TRIGGER ON USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
      split_part(NEW.email, '@', 1),
      'Gamer'
    ),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    username = COALESCE(
      NULLIF(TRIM(EXCLUDED.username), ''),
      NULLIF(TRIM(public.profiles.username), ''),
      split_part(NEW.email, '@', 1)
    ),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

