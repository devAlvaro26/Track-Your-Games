import type { Game, GameStatus } from '../types';

export function hasLegacyFavoriteStatus(game: { favorite?: boolean; status?: string | GameStatus }): boolean {
  return Boolean(game.favorite || game.status === 'Favoritos');
}

export function normalizeGame<T extends Partial<Game>>(game: T): T & Pick<Game, 'favorite' | 'status'> {
  const legacyFavorite = hasLegacyFavoriteStatus(game as any);
  const normalizedStatus = legacyFavorite ? 'Pendiente' : (game.status ?? 'Pendiente');

  return {
    ...game,
    status: normalizedStatus as GameStatus,
    favorite: Boolean(game.favorite || legacyFavorite),
  };
}

export function isFavoriteGame(game: Pick<Game, 'favorite' | 'status'>): boolean {
  return Boolean(game.favorite || hasLegacyFavoriteStatus(game as any));
}
