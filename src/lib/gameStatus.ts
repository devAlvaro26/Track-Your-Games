import type { AchievementDifficulty, GameStatus } from "../types";

export const GAME_STATUSES: GameStatus[] = ["pending", "playing", "played", "completed", "wishlist"];

// Values persisted by earlier versions (Spanish labels).
const LEGACY_STATUS: Record<string, GameStatus> = {
  Pendiente: "pending",
  Jugando: "playing",
  Jugado: "played",
  Completado: "completed",
  Deseados: "wishlist",
  "Quiero Jugar": "wishlist",
  Favoritos: "pending",
};

const LEGACY_DIFFICULTY: Record<string, AchievementDifficulty> = {
  "Fácil": "easy",
  Medio: "medium",
  "Difícil": "hard",
};

export function normalizeStatus(raw: unknown): GameStatus {
  if (typeof raw !== "string") return "pending";
  if ((GAME_STATUSES as string[]).includes(raw)) return raw as GameStatus;
  return LEGACY_STATUS[raw] ?? "pending";
}

export function normalizeDifficulty(raw: unknown): AchievementDifficulty {
  if (raw === "easy" || raw === "medium" || raw === "hard") return raw;
  return (typeof raw === "string" && LEGACY_DIFFICULTY[raw]) || "medium";
}

export function isWishlist(status: GameStatus | string | undefined): boolean {
  return status === "wishlist" || status === "Deseados" || status === "Quiero Jugar";
}
