import type { Achievement, Game, GameStatus } from '../types';
import { normalizePlatformName } from '../consoles';
import { normalizeDifficulty, normalizeStatus } from './gameStatus';
import { normalizeDate } from './dates';

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
 * Normalizes a game object: neutral status/difficulty codes, dd/mm/yyyy dates, favorite flag and platform labels.
 * Accepts records persisted by older versions (Spanish statuses, dd/mm/yyyy dates).
 */
export function normalizeGame<T extends Partial<Game>>(game: T): T & Pick<Game, 'favorite' | 'status'> {
  const isLegacy = isLegacyFavoriteStatus(game.status);
  const favorite = Boolean(game.favorite || isLegacy);

  const normalizedPlatforms = Array.isArray(game.platforms)
    ? Array.from(new Set(game.platforms.map((p) => normalizePlatformName(String(p))).filter(Boolean)))
    : game.platforms;

  const achievements: Achievement[] | undefined = Array.isArray(game.achievements)
    ? game.achievements.map((a) => ({
      ...a,
      difficulty: normalizeDifficulty(a.difficulty),
      ...(a.unlockedAt !== undefined && { unlockedAt: normalizeDate(a.unlockedAt) }),
    }))
    : game.achievements;

  return {
    ...game,
    platforms: normalizedPlatforms && normalizedPlatforms.length > 0 ? normalizedPlatforms : (game.platforms ? ["PC"] : undefined),
    status: normalizeStatus(game.status),
    favorite,
    ...(game.releaseDate !== undefined && { releaseDate: normalizeDate(game.releaseDate) }),
    ...(game.acquisitionDate !== undefined && { acquisitionDate: normalizeDate(game.acquisitionDate) }),
    ...(achievements !== undefined && { achievements }),
  };
}
