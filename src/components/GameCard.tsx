import React from "react";
import { motion } from "motion/react";
import { Game, Language } from "../types";
import { GameIcon } from "./GameIcon";
import { ConsoleBanner } from "./ConsoleBanner";
import { getTranslation, translateGenre } from "../translations";
import { isFavoriteGame } from "../lib/gameFavorite";
import * as Icons from "lucide-react";

interface GameCardProps {
  game: Game;
  onClick: () => void;
  language?: Language;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onClick, language = "en" }) => {
  const t = getTranslation(language);

  // Take only the FIRST platform for the top console banner as requested
  const primaryPlatform = game.platforms && game.platforms.length > 0 ? game.platforms[0] : "PC";

  // Achievements calculation
  const totalAchievements = game.achievements.length;
  const unlockedAchievements = game.achievements.filter((a) => a.unlocked).length;
  const achievementProgress = totalAchievements > 0
    ? Math.round((unlockedAchievements / totalAchievements) * 100)
    : 0;

  const isFavorite = isFavoriteGame(game);

  // Status badge styling
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    Pendiente: { bg: "bg-amber-500/90 text-amber-950", text: "text-amber-200", label: t.statusPendingTag || "Pendiente" },
    Deseados: { bg: "bg-purple-500/90 text-purple-950", text: "text-purple-200", label: t.statusWishlistTag || "Quiero Jugar" },
    "Quiero Jugar": { bg: "bg-purple-500/90 text-purple-950", text: "text-purple-200", label: t.statusWishlistTag || "Quiero Jugar" },
    Jugando: { bg: "bg-sky-500/90 text-sky-950", text: "text-sky-200", label: t.statusPlayingTag || "Jugando" },
    Jugado: { bg: "bg-teal-500/90 text-teal-950", text: "text-teal-200", label: t.statusPlayedTag || "Jugado" },
    Completado: { bg: "bg-emerald-500/90 text-emerald-950", text: "text-emerald-200", label: t.statusCompletedTag || "Completado" },
  };

  const statusStyle = statusConfig[game.status] || { bg: "bg-slate-700 text-white", text: "text-white", label: game.status };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{
        layout: { type: "spring", stiffness: 350, damping: 25 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
      }}
      onClick={onClick}
      className="group relative flex flex-col w-full rounded-none sm:rounded-sm overflow-hidden bg-white dark:bg-[#161618] border border-slate-300 dark:border-white/10 shadow-md hover:shadow-2xl hover:border-indigo-500 cursor-pointer transition-all select-none"
      id={`card-${game.id}`}
    >
      {/* 1. TOP CONSOLE INTEGRATED HEADER BANNER (SOLO LOGO DE CONSOLA) */}
      <ConsoleBanner
        platformName={primaryPlatform}
        size="sm"
      />

      {/* 2. MAIN POSTER COVER AREA (Aspect 2/3 independiente para no superponer ni recortar) */}
      <div
        className="relative w-full aspect-[2/3] overflow-hidden flex flex-col justify-between p-2 sm:p-3 shrink-0"
        style={{ backgroundColor: game.coverColor || "#171717" }}
      >
        {/* Full cover image if present */}
        {game.coverImage && (
          <img
            src={game.coverImage}
            alt={game.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        )}

        {/* Poster gradient shadow overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/20 pointer-events-none" />

        {/* Fallback symbol cover art if no image */}
        {!game.coverImage && (
          <div className="z-10 my-auto flex flex-col items-center justify-center py-2 sm:py-4">
            <div className="p-2.5 sm:p-3.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <GameIcon name={game.coverSymbol} className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]" size={30} />
            </div>
          </div>
        )}

        {/* Bottom Poster Info (Title & Genre) */}
        <div className="z-10 mt-auto space-y-0.5">
          <p className="text-[9px] sm:text-[10px] font-bold text-white/70 uppercase tracking-widest truncate">
            {translateGenre(game.genre, language)}
          </p>
          <h3 className="text-xs sm:text-sm font-black text-white leading-snug tracking-tight line-clamp-2 drop-shadow-md group-hover:text-indigo-300 transition-colors">
            {game.title}
          </h3>
        </div>

        {isFavorite && (
          <div className="absolute right-2 top-2 z-20 rounded-none bg-rose-500/90 p-1.5 shadow-md border border-white/20">
            <Icons.Star className="w-3.5 h-3.5 fill-amber-200 text-amber-200" />
          </div>
        )}
      </div>

      {/* 3. BOTTOM LAUNCHER STATS BAR (e.g. 🏆 0/49  0%) */}
      <div className="px-2 py-1.5 sm:px-3 sm:py-2 bg-slate-100 dark:bg-[#101012] border-t border-slate-200 dark:border-white/10 text-[9px] sm:text-[11px] font-mono text-neutral-800 dark:text-neutral-300 flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-1.5 truncate">
          <Icons.Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
          {totalAchievements > 0 ? (
            <span className="font-semibold text-neutral-800 dark:text-white/90">
              {unlockedAchievements}/{totalAchievements}
            </span>
          ) : (
            <span className="text-neutral-500 dark:text-white/50 text-[8px] sm:text-[10px] uppercase font-sans truncate">
              {t.noAchievementsRecorded || "Sin Logros"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 font-bold text-amber-400 shrink-0">
          <span>{totalAchievements > 0 ? `${achievementProgress}%` : ""}</span>
        </div>
      </div>
    </motion.div>
  );
};
