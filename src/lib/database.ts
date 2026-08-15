import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Game, AppSettings, GameStatus } from "../types";
import { normalizeGame, isFavoriteGame } from "./gameFavorite";

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
  const normalized = normalizeGame({
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
    status: (row.status as GameStatus | undefined) || "Pendiente",
    favorite: row.favorite ?? (row.status === "Favoritos"),
    coverColor: row.cover_color || "#171717",
    coverSymbol: row.cover_symbol || "gamepad",
    coverImage: row.cover_image || undefined,
    igdbId: row.igdb_id ? Number(row.igdb_id) : undefined,
    igdbRating: row.igdb_rating ? Number(row.igdb_rating) : undefined,
    igdbUrl: row.igdb_url || undefined,
    steamAppId: row.steam_app_id ? Number(row.steam_app_id) : undefined,
    achievements: Array.isArray(row.achievements) ? row.achievements : [],
    notes: row.notes || undefined,
  });

  return {
    ...normalized,
    favorite: isFavoriteGame(normalized),
  };
}

/**
 * Format client-side Game interface into database row payload
 */
export function formatGameForDb(game: Game, userId: string): any {
  const normalized = normalizeGame(game);
  return {
    id: normalized.id,
    user_id: userId,
    title: normalized.title,
    description: normalized.description || "",
    genre: normalized.genre || "",
    platforms: normalized.platforms || [],
    release_date: normalized.releaseDate || "",
    barcode: normalized.barcode || "",
    acquisition_date: normalized.acquisitionDate || "",
    rating: normalized.rating || 0,
    play_time: normalized.playTime || 0,
    status: normalized.status || "Pendiente",
    favorite: Boolean(normalized.favorite),
    cover_color: normalized.coverColor || "#171717",
    cover_symbol: normalized.coverSymbol || "gamepad",
    cover_image: normalized.coverImage || "",
    igdb_id: normalized.igdbId || null,
    igdb_rating: normalized.igdbRating || null,
    igdb_url: normalized.igdbUrl || null,
    steam_app_id: normalized.steamAppId || null,
    achievements: normalized.achievements || [],
    notes: normalized.notes || "",
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetch all games for the currently logged in user from the database
 */
export async function fetchUserGamesFromDb(userId: string): Promise<Game[]> {
  if (!db) return [];

  try {
    const { data, error } = await db
      .from("games")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Error fetching games from database:", error.message);
      return [];
    }

    return (data || []).map(formatGameFromDb);
  } catch (err: any) {
    console.warn("Network error fetching games from database:", err?.message || err);
    return [];
  }
}

/**
 * Insert or update a game in the database for a user
 */
export async function saveGameToDb(game: Game, userId: string): Promise<void> {
  if (!db) return;

  try {
    const payload = formatGameForDb(game, userId);
    const { error } = await db
      .from("games")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.warn("Error saving game to database:", error.message);
    }
  } catch (err: any) {
    console.warn("Network error saving game to database:", err?.message || err);
  }
}

/**
 * Delete a game from the database
 */
export async function deleteGameFromDb(gameId: string, userId: string): Promise<void> {
  if (!db) return;

  try {
    const { error } = await db
      .from("games")
      .delete()
      .eq("id", gameId)
      .eq("user_id", userId);

    if (error) {
      console.warn("Error deleting game from database:", error.message);
    }
  } catch (err: any) {
    console.warn("Network error deleting game from database:", err?.message || err);
  }
}

/**
 * Get user profile from the profiles table
 */
export async function fetchUserProfile(userId: string): Promise<{ username?: string; language?: string; theme?: string; avatar_url?: string } | null> {
  if (!db) return null;

  try {
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
  } catch (err: any) {
    console.warn("Network error fetching user profile:", err?.message || err);
    return null;
  }
}

/**
 * Save user profile settings to the profiles table
 */
export async function saveUserProfile(userId: string, settings: Partial<AppSettings>): Promise<void> {
  if (!db) return;

  try {
    const payload: any = {
      id: userId,
      updated_at: new Date().toISOString(),
    };
    if (settings.username) payload.username = settings.username;
    if (settings.language) payload.language = settings.language;
    if (settings.theme) payload.theme = settings.theme;
    if (settings.avatarUrl !== undefined) payload.avatar_url = settings.avatarUrl;

    const { error } = await db
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.warn("Error saving user profile to database:", error.message);
    }
  } catch (err: any) {
    console.warn("Network error saving user profile to database:", err?.message || err);
  }
}
