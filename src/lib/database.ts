import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Game, AppSettings, GameStatus, FriendProfile, Friendship } from "../types";
import { normalizeGame, isFavoriteGame } from "./gameFavorite";
import { normalizeStatus } from "./gameStatus";
import { normalizePlatformName } from "../consoles";

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
  const rawPlatforms = Array.isArray(row.platforms) ? row.platforms : [];
  const normalizedPlatforms: string[] = Array.from(
    new Set(rawPlatforms.map((p: any) => normalizePlatformName(String(p))).filter(Boolean))
  );

  const baseGame: Game = {
    id: String(row.id || ""),
    title: String(row.title || ""),
    description: String(row.description || ""),
    genre: String(row.genre || ""),
    platforms: normalizedPlatforms.length > 0 ? normalizedPlatforms : ["PC"],
    releaseDate: String(row.release_date || ""),
    barcode: String(row.barcode || ""),
    acquisitionDate: String(row.acquisition_date || ""),
    rating: Number(row.rating) || 0,
    playTime: Number(row.play_time) || 0,
    status: (row.status as GameStatus | undefined) || "pending",
    favorite: Boolean(row.favorite ?? (row.status === "Favoritos")),
    coverColor: String(row.cover_color || "#171717"),
    coverSymbol: String(row.cover_symbol || "gamepad"),
    coverImage: row.cover_image ? String(row.cover_image) : undefined,
    igdbId: row.igdb_id ? Number(row.igdb_id) : undefined,
    igdbRating: row.igdb_rating ? Number(row.igdb_rating) : undefined,
    igdbUrl: row.igdb_url ? String(row.igdb_url) : undefined,
    steamAppId: row.steam_app_id ? Number(row.steam_app_id) : undefined,
    achievements: Array.isArray(row.achievements) ? row.achievements : [],
    notes: row.notes ? String(row.notes) : undefined,
  };

  const normalized = normalizeGame(baseGame);

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
  const rawPlatforms = Array.isArray(normalized.platforms) ? normalized.platforms : [];
  const normalizedPlatforms: string[] = Array.from(
    new Set(rawPlatforms.map((p) => normalizePlatformName(String(p))).filter(Boolean))
  );

  return {
    id: normalized.id,
    user_id: userId,
    title: normalized.title,
    description: normalized.description || "",
    genre: normalized.genre || "",
    platforms: normalizedPlatforms.length > 0 ? normalizedPlatforms : ["PC"],
    release_date: normalized.releaseDate || "",
    barcode: normalized.barcode || "",
    acquisition_date: normalized.acquisitionDate || "",
    rating: normalized.rating || 0,
    play_time: normalized.playTime || 0,
    status: normalized.status || "pending",
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
 * Fetch all games for the currently logged in user from the database.
 * Throws on failure so callers can tell an error from an empty library.
 */
export async function fetchUserGamesFromDb(userId: string): Promise<Game[]> {
  if (!db) return [];

  const { data, error } = await db
    .from("games")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map(formatGameFromDb);
}

/**
 * Insert or update a game in the database for a user. Throws on failure.
 */
export async function saveGameToDb(game: Game, userId: string): Promise<void> {
  if (!db) return;

  const payload = formatGameForDb(game, userId);
  const { error } = await db
    .from("games")
    .upsert(payload, { onConflict: "id" });

  if (error) throw new Error(error.message);
}

/**
 * Delete a game from the database. Throws on failure.
 */
export async function deleteGameFromDb(gameId: string, userId: string): Promise<void> {
  if (!db) return;

  const { error } = await db
    .from("games")
    .delete()
    .eq("id", gameId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
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

// -------------------------------------------------------------
// FRIENDS & COMMUNITY FUNCTIONS
// -------------------------------------------------------------

/**
 * Games count per user in one round trip (see get_games_counts in supabase/schema.sql).
 */
async function fetchGamesCounts(userIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!db || userIds.length === 0) return counts;

  try {
    const { data, error } = await db.rpc("get_games_counts", { user_ids: userIds });
    if (error) {
      console.warn("Could not fetch games counts:", error.message);
      return counts;
    }
    (data || []).forEach((row: any) => counts.set(row.user_id, Number(row.games_count) || 0));
  } catch (err: any) {
    console.warn("Network error fetching games counts:", err?.message || err);
  }
  return counts;
}

/**
 * Search profiles with a username set by a real registered user.
 */
export async function searchProfiles(query: string, currentUserId?: string): Promise<FriendProfile[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const cleanQuery = trimmed.startsWith("@") ? trimmed.slice(1).trim() : trimmed;
  if (!cleanQuery) return [];

  if (!db || !isDatabaseConfigured) return [];

  try {
    // Search by username (case-insensitive substring).
    let queryBuilder = db
      .from("profiles")
      .select("*")
      .ilike("username", `%${cleanQuery}%`)
      .not("username", "is", null)
      .neq("username", "")
      .limit(20);

    if (currentUserId) {
      queryBuilder = queryBuilder.neq("id", currentUserId);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error("Error searching profiles in Supabase:", error.message, error.details || "", error.hint || "");
      return [];
    }

    if (!data || data.length === 0) return [];

    // For each found profile, get game counts in a single query
    const counts = await fetchGamesCounts(data.map((row: any) => row.id));

    return data
      .filter((row: any) => typeof row.username === "string" && row.username.trim())
      .map((row: any) => ({
        id: row.id,
        username: row.username.trim(),
        avatarUrl: row.avatar_url || row.avatarUrl || undefined,
        bio: row.bio || undefined,
        favoriteConsole: row.favorite_console || undefined,
        gamesCount: counts.get(row.id) ?? 0,
      }));
  } catch (err: any) {
    console.error("Network exception searching profiles:", err?.message || err);
    return [];
  }
}

/**
 * Fetch all friendships for a user (accepted friends, incoming requests, outgoing requests)
 */
export async function fetchFriendships(userId: string): Promise<{
  friends: Friendship[];
  incoming: Friendship[];
  outgoing: Friendship[];
}> {
  if (!db || !isDatabaseConfigured) {
    return { friends: [], incoming: [], outgoing: [] };
  }

  try {
    const { data, error } = await db
      .from("friendships")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) {
      console.warn("Error fetching friendships:", error.message);
      return { friends: [], incoming: [], outgoing: [] };
    }

    if (!data || data.length === 0) {
      return { friends: [], incoming: [], outgoing: [] };
    }

    // Collect all other user IDs to batch fetch their profiles
    const otherUserIds = Array.from(
      new Set(data.map((r: any) => (r.sender_id === userId ? r.receiver_id : r.sender_id)))
    );

    const { data: profilesData } = await db
      .from("profiles")
      .select("*")
      .in("id", otherUserIds)
      .not("username", "is", null)
      .neq("username", "");

    const profilesMap = new Map<string, FriendProfile>();
    (profilesData || []).forEach((p: any) => {
      if (typeof p.username !== "string" || !p.username.trim()) return;
      profilesMap.set(p.id, {
        id: p.id,
        username: p.username.trim(),
        avatarUrl: p.avatar_url || p.avatarUrl || undefined,
        bio: p.bio || undefined,
        favoriteConsole: p.favorite_console || undefined,
      });
    });

    // Batch game counts for every friend
    const counts = await fetchGamesCounts(otherUserIds as string[]);
    for (const uid of otherUserIds as string[]) {
      const existing = profilesMap.get(uid);
      if (existing) existing.gamesCount = counts.get(uid) ?? 0;
    }

    const friends: Friendship[] = [];
    const incoming: Friendship[] = [];
    const outgoing: Friendship[] = [];

    data.forEach((row: any) => {
      const isSender = row.sender_id === userId;
      const otherId = isSender ? row.receiver_id : row.sender_id;
      const profile = profilesMap.get(otherId);
      if (!profile) return;

      const friendship: Friendship = {
        id: row.id,
        senderId: row.sender_id,
        receiverId: row.receiver_id,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        friendProfile: profile,
        isSender,
      };

      if (row.status === "accepted") {
        friends.push(friendship);
      } else if (row.status === "pending") {
        if (isSender) {
          outgoing.push(friendship);
        } else {
          incoming.push(friendship);
        }
      }
    });

    return { friends, incoming, outgoing };
  } catch (err: any) {
    console.warn("Network error fetching friendships:", err?.message || err);
    return { friends: [], incoming: [], outgoing: [] };
  }
}

/**
 * Send a friend request to another user
 */
export async function sendFriendRequest(
  senderId: string,
  receiverId: string,
): Promise<{ success: boolean; error?: string }> {
  if (senderId === receiverId) {
    return { success: false, error: "cannotAddSelf" };
  }

  if (!db || !isDatabaseConfigured) {
    return { success: false, error: "databaseNotConfigured" };
  }

  try {
    const { data: receiverProfile, error: profileError } = await db
      .from("profiles")
      .select("id, username")
      .eq("id", receiverId)
      .not("username", "is", null)
      .neq("username", "")
      .maybeSingle();

    if (profileError) throw profileError;
    if (!receiverProfile?.username?.trim()) return { success: false, error: "userNotFound" };

    // Check if a friendship already exists
    const { data: existing } = await db
      .from("friendships")
      .select("id, status, sender_id, receiver_id")
      .or(
        `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
      );

    if (existing && existing.length > 0) {
      const match = existing[0];
      if (match.status === "accepted") {
        return { success: false, error: "alreadyFriends" };
      }
      return { success: false, error: "requestPending" };
    }

    const { error } = await db.from("friendships").insert({
      sender_id: senderId,
      receiver_id: receiverId,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("Error sending friend request:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.warn("Network error sending friend request:", err?.message || err);
    return { success: false, error: err?.message || "Error al enviar solicitud" };
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(friendshipId: string): Promise<{ success: boolean; error?: string }> {
  if (!db || !isDatabaseConfigured) {
    return { success: false, error: "databaseNotConfigured" };
  }

  try {
    const { error } = await db
      .from("friendships")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", friendshipId);

    if (error) {
      console.warn("Error accepting friend request:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.warn("Network error accepting friend request:", err?.message || err);
    return { success: false, error: err?.message || "Error al aceptar solicitud" };
  }
}

/**
 * Reject or cancel a friend request
 */
export async function rejectFriendRequest(friendshipId: string): Promise<{ success: boolean; error?: string }> {
  return removeFriend(friendshipId);
}

/**
 * Remove a friend / delete friendship
 */
export async function removeFriend(friendshipId: string): Promise<{ success: boolean; error?: string }> {
  if (!db || !isDatabaseConfigured) {
    return { success: false, error: "databaseNotConfigured" };
  }

  try {
    const { error } = await db.from("friendships").delete().eq("id", friendshipId);

    if (error) {
      console.warn("Error deleting friendship:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.warn("Network error deleting friendship:", err?.message || err);
    return { success: false, error: err?.message || "Error al eliminar amigo" };
  }
}

/**
 * Fetch games of an accepted friend
 */
export async function fetchFriendGames(friendUserId: string): Promise<Game[]> {
  if (!db || !isDatabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await db
      .from("games")
      .select("*")
      .eq("user_id", friendUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Error fetching friend games from database:", error.message);
      return [];
    }

    return (data || []).map(formatGameFromDb);
  } catch (err: any) {
    console.warn("Network error fetching friend games:", err?.message || err);
    return [];
  }
}

/**
 * Fetch detailed profile of a friend including statistics
 */
export async function fetchFriendProfile(friendUserId: string): Promise<FriendProfile | null> {
  if (!db || !isDatabaseConfigured) {
    return null;
  }

  try {
    const { data: profile, error } = await db
      .from("profiles")
      .select("*")
      .eq("id", friendUserId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.warn("Error fetching friend profile:", error.message);
    }
    if (!profile?.username?.trim()) return null;

    const { data: gamesData } = await db
      .from("games")
      .select("id, status, play_time")
      .eq("user_id", friendUserId);

    const totalGames = gamesData?.length || 0;
    const completedCount = gamesData?.filter((g: any) => normalizeStatus(g.status) === "completed").length || 0;
    const totalHours = (gamesData || []).reduce((acc: number, curr: any) => acc + (Number(curr.play_time) || 0), 0);

    return {
      id: friendUserId,
      username: profile.username,
      avatarUrl: profile?.avatar_url || undefined,
      bio: profile?.bio || undefined,
      favoriteConsole: profile?.favorite_console || undefined,
      gamesCount: totalGames,
      completedCount,
      totalHours,
    };
  } catch (err: any) {
    console.warn("Network error fetching friend profile details:", err?.message || err);
    return null;
  }
}
