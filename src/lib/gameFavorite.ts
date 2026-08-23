import type { Game, GameStatus } from '../types';
import { normalizePlatformName } from '../consoles';

/**
 * Checks if a game record has the legacy 'Favoritos' string stored in its status field.
 */
export function isLegacyFavoriteStatus(status?: string | GameStatus): boolean {
  return status === 'Favoritos';
}

/**
 * Checks if a game is marked as a favorite.
 */
export function isFavoriteGame(game?: { favorite?: boolean; status?: string | GameStatus } | null): boolean {
  if (!game) return false;
  return Boolean(game.favorite || game.status === 'Favoritos');
}

/**
 * Normalizes a game object ensuring valid status, favorite flag, and platform labels.
 */
export function normalizeGame<T extends Partial<Game>>(game: T): T & Pick<Game, 'favorite' | 'status'> {
  const isLegacy = isLegacyFavoriteStatus(game.status);
  const favorite = Boolean(game.favorite || isLegacy);
  const normalizedStatus = isLegacy ? 'Pendiente' : (game.status ?? 'Pendiente');

  const normalizedPlatforms = Array.isArray(game.platforms)
    ? Array.from(new Set(game.platforms.map((p) => normalizePlatformName(String(p))).filter(Boolean)))
    : game.platforms;

  return {
    ...game,
    platforms: normalizedPlatforms && normalizedPlatforms.length > 0 ? normalizedPlatforms : (game.platforms ? ["PC"] : undefined),
    status: normalizedStatus as GameStatus,
    favorite,
  };
}
