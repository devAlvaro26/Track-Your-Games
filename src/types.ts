export interface Achievement {
  id: string;
  name: string;
  description: string;
  difficulty: "Fácil" | "Medio" | "Difícil";
  unlocked: boolean;
  unlockedAt?: string; // date string
  icon?: string; // Steam achievement unlocked icon URL
  iconLocked?: string; // Steam achievement locked icon URL
  steamApiName?: string;
}

export type GameStatus = "Pendiente" | "Jugando" | "Jugado" | "Completado" | "Deseados" | "Quiero Jugar";

export interface Game {
  id: string;
  title: string;
  description: string;
  genre: string;
  platforms: string[];
  releaseDate: string; // dd/mm/yyyy or year
  barcode: string; // barcode string
  acquisitionDate: string; // user acquisition date
  rating: number; // 1-5 stars
  playTime: number; // in hours
  status: GameStatus;
  favorite?: boolean;
  coverColor: string; // Hex color for fallback covers
  coverSymbol: string; // Lucide icon name for fallback covers
  coverImage?: string; // User-provided or IGDB official cover image URL
  igdbId?: number; // Official IGDB game ID
  igdbRating?: number; // Official IGDB rating score (0-100)
  igdbUrl?: string; // Link to official IGDB game page
  steamAppId?: number; // Official Steam App ID
  achievements: Achievement[];
  notes?: string; // custom personal notes
}

export interface SteamSearchResult {
  appId: number;
  name: string;
  headerImage?: string;
  tinyImage?: string;
}

export interface SteamAchievementFetchResponse {
  success: boolean;
  appId?: number;
  gameName?: string;
  achievements: Achievement[];
  error?: string;
}

export interface IgdbSearchResult {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  firstReleaseDate?: string; // dd/mm/yyyy or year
  genres: string[];
  platforms: string[];
  coverUrl?: string;
  coverImageId?: string;
  rating?: number;
  url?: string;
}

export interface IgdbStatusResponse {
  configured: boolean;
  clientIdPresent: boolean;
  clientSecretPresent: boolean;
}

export type Language = "es" | "en";

export interface AppSettings {
  theme: "light" | "dark";
  language: Language;
  username: string;
  avatarUrl?: string;
}

export interface LibraryStats {
  totalGames: number;
  completedGames: number;
  totalHours: number;
  totalAchievementsUnlocked: number;
  totalAchievements: number;
}

export type FriendshipStatus = "pending" | "accepted" | "rejected";

export interface FriendProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  favoriteConsole?: string;
  gamesCount?: number;
  completedCount?: number;
  totalHours?: number;
}

export interface Friendship {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt?: string;
  friendProfile: FriendProfile;
  isSender: boolean;
}
