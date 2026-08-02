import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Game, AppSettings } from "../types";

// Get database environment variables
const env = (import.meta as any).env || {};
const databaseUrl = (env.VITE_DATABASE_URL || "").trim();
const databaseAnonKey = (env.VITE_DATABASE_ANON_KEY || "").trim();

export const isDatabaseConfigured = Boolean(databaseUrl && databaseAnonKey);

export const db: SupabaseClient | null = isDatabaseConfigured
  ? createClient(databaseUrl, databaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
  : null;

/**
 * Format a database game row into client-side Game interface
 */
export function formatGameFromDb(row: any): Game {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    genre: row.genre || "",
    platforms: Array.isArray(row.platforms) ? row.platforms : [],
    releaseDate: row.release_date || "",
    barcode: row.barcode || "",
    acquisitionDate: row.acquisition_date || "",
    rating: Number(row.rating) || 0,
    playTime: Number(row.play_time) || 0,
    status: row.status || "Pendiente",
    coverColor: row.cover_color || "#171717",
    coverSymbol: row.cover_symbol || "gamepad",
    coverImage: row.cover_image || undefined,
    igdbId: row.igdb_id ? Number(row.igdb_id) : undefined,
    igdbRating: row.igdb_rating ? Number(row.igdb_rating) : undefined,
    igdbUrl: row.igdb_url || undefined,
    achievements: Array.isArray(row.achievements) ? row.achievements : [],
    notes: row.notes || undefined,
  };
}

/**
 * Format client-side Game interface into database row payload
 */
export function formatGameForDb(game: Game, userId: string): any {
  return {
    id: game.id,
    user_id: userId,
    title: game.title,
    description: game.description || "",
    genre: game.genre || "",
    platforms: game.platforms || [],
    release_date: game.releaseDate || "",
    barcode: game.barcode || "",
    acquisition_date: game.acquisitionDate || "",
    rating: game.rating || 0,
    play_time: game.playTime || 0,
    status: game.status || "Pendiente",
    cover_color: game.coverColor || "#171717",
    cover_symbol: game.coverSymbol || "gamepad",
    cover_image: game.coverImage || "",
    igdb_id: game.igdbId || null,
    igdb_rating: game.igdbRating || null,
    igdb_url: game.igdbUrl || null,
    achievements: game.achievements || [],
    notes: game.notes || "",
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetch all games for the currently logged in user from the database
 */
export async function fetchUserGamesFromDb(userId: string): Promise<Game[]> {
  if (!db) return [];

  const { data, error } = await db
    .from("games")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching games from database:", error.message);
    throw new Error(error.message);
  }

  return (data || []).map(formatGameFromDb);
}

/**
 * Insert or update a game in the database for a user
 */
export async function saveGameToDb(game: Game, userId: string): Promise<void> {
  if (!db) return;

  const payload = formatGameForDb(game, userId);
  const { error } = await db
    .from("games")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("Error saving game to database:", error.message);
    throw new Error(error.message);
  }
}

/**
 * Delete a game from the database
 */
export async function deleteGameFromDb(gameId: string, userId: string): Promise<void> {
  if (!db) return;

  const { error } = await db
    .from("games")
    .delete()
    .eq("id", gameId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting game from database:", error.message);
    throw new Error(error.message);
  }
}

/**
 * Get user profile from the profiles table
 */
export async function fetchUserProfile(userId: string): Promise<{ username?: string; language?: string; theme?: string } | null> {
  if (!db) return null;

  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.warn("Could not fetch user profile:", error.message);
    return null;
  }

  return data;
}

/**
 * Save user profile settings to the profiles table
 */
export async function saveUserProfile(userId: string, settings: Partial<AppSettings>): Promise<void> {
  if (!db) return;

  const payload: any = {
    id: userId,
    updated_at: new Date().toISOString(),
  };
  if (settings.username) payload.username = settings.username;
  if (settings.language) payload.language = settings.language;
  if (settings.theme) payload.theme = settings.theme;

  const { error } = await db
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("Error saving user profile to database:", error.message);
  }
}
