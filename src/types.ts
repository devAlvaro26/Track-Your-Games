export interface Achievement {
  id: string;
  name: string;
  description: string;
  difficulty: "Fácil" | "Medio" | "Difícil";
  unlocked: boolean;
  unlockedAt?: string; // date string
}

export type GameStatus = "Pendiente" | "Jugando" | "Completado" | "Favoritos" | "Deseados" | "Quiero Jugar";

export interface Game {
  id: string;
  title: string;
  description: string;
  genre: string;
  platforms: string[];
  releaseDate: string; // release date / year
  barcode: string; // barcode string
  acquisitionDate: string; // user acquisition date
  rating: number; // 1-5 stars
  playTime: number; // in hours
  status: GameStatus;
  coverColor: string; // Hex color for fallback covers
  coverSymbol: string; // Lucide icon name for fallback covers
  coverImage?: string; // User-provided or IGDB official cover image URL
  igdbId?: number; // Official IGDB game ID
  igdbRating?: number; // Official IGDB rating score (0-100)
  igdbUrl?: string; // Link to official IGDB game page
  achievements: Achievement[];
  notes?: string; // custom personal notes
}

export interface IgdbSearchResult {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  firstReleaseDate?: string; // YYYY-MM-DD or year
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
