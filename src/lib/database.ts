import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Game, AppSettings, GameStatus, FriendProfile, Friendship } from "../types";
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

// -------------------------------------------------------------
// FRIENDS & COMMUNITY FUNCTIONS
// -------------------------------------------------------------

// Local storage mock helpers for standalone/demo usage when database is offline
const MOCK_PROFILES: FriendProfile[] = [
  {
    id: "demo-friend-1",
    username: "RetroPixel_99",
    bio: "Coleccionista apasionado de SNES y Mega Drive.",
    favoriteConsole: "Super Nintendo",
    avatarUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80",
    gamesCount: 14,
    completedCount: 6,
    totalHours: 120,
  },
  {
    id: "demo-friend-2",
    username: "Kenshiro_Gamer",
    bio: "Amante de los JRPGs clásicos y juegos de lucha arcade.",
    favoriteConsole: "PlayStation 2",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    gamesCount: 8,
    completedCount: 3,
    totalHours: 75,
  },
  {
    id: "demo-friend-3",
    username: "ChronoCollector",
    bio: "Buscando completar la saga de Final Fantasy y Chrono Trigger.",
    favoriteConsole: "Game Boy Advance",
    avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    gamesCount: 22,
    completedCount: 11,
    totalHours: 240,
  },
];

const MOCK_FRIEND_GAMES: Record<string, Game[]> = {
  "demo-friend-1": [
    {
      id: "friend1-game-1",
      title: "Super Mario World",
      description: "Mario y Luigi viajan a Dinosaur Land para rescatar a la Princesa Peach de Bowser.",
      genre: "Plataformas",
      platforms: ["Super Nintendo", "Game Boy Advance"],
      releaseDate: "21/11/1990",
      barcode: "0045496830113",
      acquisitionDate: "15/04/2023",
      rating: 5,
      playTime: 38,
      status: "Completado",
      favorite: true,
      coverColor: "#E11D48",
      coverSymbol: "gamepad",
      coverImage: "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co670w.jpg",
      achievements: [
        { id: "a1", name: "Special World Clear", description: "Completa todos los niveles del Mundo Especial", difficulty: "Difícil", unlocked: true },
        { id: "a2", name: "96 Exits", description: "Encuentra todas las 96 salidas del mapa", difficulty: "Difícil", unlocked: true },
        { id: "a3", name: "Yoshi Master", description: "Monta todos los colores de Yoshi", difficulty: "Medio", unlocked: true },
      ],
      notes: "Copia original NTSC-US con caja y manual en perfecto estado.",
    },
    {
      id: "friend1-game-2",
      title: "Chrono Trigger",
      description: "Una obra maestra de Square sobre viajes a través del tiempo con múltiples finales.",
      genre: "RPG",
      platforms: ["Super Nintendo", "Nintendo DS"],
      releaseDate: "11/03/1995",
      barcode: "0045496830205",
      acquisitionDate: "02/09/2023",
      rating: 5,
      playTime: 62,
      status: "Completado",
      favorite: true,
      coverColor: "#7C3AED",
      coverSymbol: "trophy",
      coverImage: "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co3p2b.jpg",
      achievements: [
        { id: "ct1", name: "Lavos Defeated", description: "Derrota a Lavos en el Fin de los Tiempos", difficulty: "Difícil", unlocked: true },
        { id: "ct2", name: "All Endings", description: "Desbloquea los 13 finales diferentes en New Game+", difficulty: "Difícil", unlocked: false },
      ],
      notes: "El mejor RPG de la historia.",
    },
    {
      id: "friend1-game-3",
      title: "Castlevania: Symphony of the Night",
      description: "Alucard despierta para explorar el castillo maldito de su padre Drácula.",
      genre: "Metroidvania",
      platforms: ["PlayStation", "Sega Saturn"],
      releaseDate: "20/03/1997",
      barcode: "0083717170054",
      acquisitionDate: "10/01/2024",
      rating: 5,
      playTime: 20,
      status: "Jugando",
      favorite: true,
      coverColor: "#059669",
      coverSymbol: "ghost",
      coverImage: "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co1vce.jpg",
      achievements: [
        { id: "sotn1", name: "Inverted Castle", description: "Descubre y entra al Castillo Invertido", difficulty: "Medio", unlocked: true },
        { id: "sotn2", name: "200.6% Map", description: "Explora cada habitación de ambos castillos", difficulty: "Difícil", unlocked: false },
      ],
    },
  ],
  "demo-friend-2": [
    {
      id: "friend2-game-1",
      title: "Metal Gear Solid 3: Snake Eater",
      description: "Naked Snake se infiltra en las junglas soviéticas durante la Guerra Fría.",
      genre: "Acción / Sigilo",
      platforms: ["PlayStation 2", "PlayStation 3"],
      releaseDate: "17/11/2004",
      barcode: "0083717201086",
      acquisitionDate: "12/05/2023",
      rating: 5,
      playTime: 45,
      status: "Completado",
      favorite: true,
      coverColor: "#0D9488",
      coverSymbol: "target",
      coverImage: "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co257b.jpg",
      achievements: [
        { id: "mgs1", name: "FOXHOUND Rank", description: "Completa el juego con el rango más alto sin alertar ni matar", difficulty: "Difícil", unlocked: true },
      ],
    },
    {
      id: "friend2-game-2",
      title: "Tekken 3",
      description: "El torneo de King of Iron Fist regresa con Jin Kazama, Eddy Gordo y Hwoarang.",
      genre: "Lucha",
      platforms: ["PlayStation", "Arcade"],
      releaseDate: "20/03/1997",
      barcode: "0722674020305",
      acquisitionDate: "18/08/2023",
      rating: 4.5,
      playTime: 30,
      status: "Jugado",
      coverColor: "#D97706",
      coverSymbol: "flame",
      coverImage: "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co1v9x.jpg",
      achievements: [
        { id: "tk1", name: "Tekken Force Master", description: "Completa las 4 fases del modo Tekken Force", difficulty: "Medio", unlocked: true },
      ],
    },
  ],
  "demo-friend-3": [
    {
      id: "friend3-game-1",
      title: "The Legend of Zelda: The Minish Cap",
      description: "Link adquiere a Ezlo, un sombrero mágico que le permite encogerse al tamaño de los Minish.",
      genre: "Aventura",
      platforms: ["Game Boy Advance"],
      releaseDate: "04/11/2004",
      barcode: "0045496733971",
      acquisitionDate: "10/11/2023",
      rating: 5,
      playTime: 25,
      status: "Completado",
      favorite: true,
      coverColor: "#059669",
      coverSymbol: "compass",
      coverImage: "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co1v2n.jpg",
      achievements: [
        { id: "mc1", name: "All Kinstones", description: "Fusiona todas las Piedras de la Suerte en Hyrule", difficulty: "Difícil", unlocked: true },
      ],
    },
  ],
};

function getLocalFriendships(): Friendship[] {
  try {
    const raw = localStorage.getItem("game_library_local_friendships");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Error reading local friendships:", e);
  }
  // Default mock friendships
  return [
    {
      id: "f-mock-1",
      senderId: "demo-friend-1",
      receiverId: "current-user",
      status: "accepted",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      friendProfile: MOCK_PROFILES[0],
      isSender: false,
    },
    {
      id: "f-mock-2",
      senderId: "demo-friend-2",
      receiverId: "current-user",
      status: "accepted",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      friendProfile: MOCK_PROFILES[1],
      isSender: false,
    },
    {
      id: "f-mock-3",
      senderId: "demo-friend-3",
      receiverId: "current-user",
      status: "pending",
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      friendProfile: MOCK_PROFILES[2],
      isSender: false,
    },
  ];
}

function saveLocalFriendships(list: Friendship[]) {
  try {
    localStorage.setItem("game_library_local_friendships", JSON.stringify(list));
  } catch (e) {
    console.warn("Error saving local friendships:", e);
  }
}

/**
 * Search profiles by username or ID
 */
export async function searchProfiles(query: string, currentUserId?: string): Promise<FriendProfile[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const cleanQuery = trimmed.startsWith("@") ? trimmed.slice(1).trim() : trimmed;
  if (!cleanQuery) return [];

  if (!db || !isDatabaseConfigured) {
    // Return mock results filtered by query
    return MOCK_PROFILES.filter(
      (p) =>
        p.id !== currentUserId &&
        (p.username.toLowerCase().includes(cleanQuery.toLowerCase()) || p.id === cleanQuery)
    );
  }

  try {
    // Search by username (case-insensitive substring) or by user ID
    let queryBuilder = db
      .from("profiles")
      .select("*")
      .ilike("username", `%${cleanQuery}%`)
      .limit(20);

    if (currentUserId) {
      queryBuilder = queryBuilder.neq("id", currentUserId);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error("Error searching profiles in Supabase:", error.message, error.details || "", error.hint || "");
      return [];
    }

    if (!data || data.length === 0) {
      // Fallback: If no results matching ilike username, try matching ID if valid UUID
      if (cleanQuery.length >= 8) {
        try {
          const { data: idData } = await db
            .from("profiles")
            .select("*")
            .eq("id", cleanQuery)
            .limit(1);
          if (idData && idData.length > 0 && idData[0].id !== currentUserId) {
            return idData.map((row: any) => ({
              id: row.id,
              username: row.username || "Gamer",
              avatarUrl: row.avatar_url || row.avatarUrl || undefined,
              bio: row.bio || undefined,
              favoriteConsole: row.favorite_console || undefined,
              gamesCount: 0,
            }));
          }
        } catch (_) {}
      }
      return [];
    }

    // For each found profile, get game counts safely
    const results: FriendProfile[] = await Promise.all(
      data.map(async (row: any) => {
        let gamesCount = 0;
        try {
          const { count } = await db!
            .from("games")
            .select("id", { count: "exact", head: true })
            .eq("user_id", row.id);
          gamesCount = count || 0;
        } catch (_) {}

        return {
          id: row.id,
          username: row.username || "Gamer",
          avatarUrl: row.avatar_url || row.avatarUrl || undefined,
          bio: row.bio || undefined,
          favoriteConsole: row.favorite_console || undefined,
          gamesCount,
        };
      })
    );

    return results;
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
    const list = getLocalFriendships();
    return {
      friends: list.filter((f) => f.status === "accepted"),
      incoming: list.filter((f) => f.status === "pending" && !f.isSender),
      outgoing: list.filter((f) => f.status === "pending" && f.isSender),
    };
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
      .in("id", otherUserIds);

    const profilesMap = new Map<string, FriendProfile>();
    (profilesData || []).forEach((p: any) => {
      profilesMap.set(p.id, {
        id: p.id,
        username: p.username || "Gamer",
        avatarUrl: p.avatar_url || p.avatarUrl || undefined,
        bio: p.bio || undefined,
        favoriteConsole: p.favorite_console || undefined,
      });
    });

    // Also get game counts for each friend
    for (const uid of otherUserIds) {
      try {
        const { count } = await db
          .from("games")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid);
        const existing = profilesMap.get(uid);
        if (existing) {
          existing.gamesCount = count || 0;
        }
      } catch (_) {}
    }

    const friends: Friendship[] = [];
    const incoming: Friendship[] = [];
    const outgoing: Friendship[] = [];

    data.forEach((row: any) => {
      const isSender = row.sender_id === userId;
      const otherId = isSender ? row.receiver_id : row.sender_id;
      const profile = profilesMap.get(otherId) || {
        id: otherId,
        username: "Gamer",
      };

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
  targetProfile?: FriendProfile
): Promise<{ success: boolean; error?: string }> {
  if (senderId === receiverId) {
    return { success: false, error: "cannotAddSelf" };
  }

  if (!db || !isDatabaseConfigured) {
    const list = getLocalFriendships();
    const existing = list.find(
      (f) =>
        (f.senderId === senderId && f.receiverId === receiverId) ||
        (f.senderId === receiverId && f.receiverId === senderId)
    );

    if (existing) {
      if (existing.status === "accepted") return { success: false, error: "alreadyFriends" };
      return { success: false, error: "requestPending" };
    }

    const newReq: Friendship = {
      id: `mock-req-${Date.now()}`,
      senderId,
      receiverId,
      status: "pending",
      createdAt: new Date().toISOString(),
      friendProfile: targetProfile || { id: receiverId, username: "Gamer" },
      isSender: true,
    };
    saveLocalFriendships([newReq, ...list]);
    return { success: true };
  }

  try {
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
    const list = getLocalFriendships();
    const updated = list.map((f) => (f.id === friendshipId ? { ...f, status: "accepted" as const } : f));
    saveLocalFriendships(updated);
    return { success: true };
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
    const list = getLocalFriendships();
    const filtered = list.filter((f) => f.id !== friendshipId);
    saveLocalFriendships(filtered);
    return { success: true };
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
    return MOCK_FRIEND_GAMES[friendUserId] || [];
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
    const mock = MOCK_PROFILES.find((p) => p.id === friendUserId);
    if (mock) return mock;
    return { id: friendUserId, username: "Amigo", gamesCount: (MOCK_FRIEND_GAMES[friendUserId] || []).length };
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

    const { data: gamesData } = await db
      .from("games")
      .select("id, status, play_time")
      .eq("user_id", friendUserId);

    const totalGames = gamesData?.length || 0;
    const completedCount = gamesData?.filter((g: any) => g.status === "Completado").length || 0;
    const totalHours = (gamesData || []).reduce((acc: number, curr: any) => acc + (Number(curr.play_time) || 0), 0);

    return {
      id: friendUserId,
      username: profile?.username || "Gamer",
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
