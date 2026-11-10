import React, { memo, useState } from "react";
import { motion } from "motion/react";
import { Game, Language } from "../types";
import { GameIcon } from "./GameIcon";
import { ConsoleBanner } from "./ConsoleBanner";
import { getTranslation, translateGenre } from "../translations";
import { isFavoriteGame } from "../lib/gameFavorite";
import { Star, Trophy } from "lucide-react";

interface GameCardProps {
  game: Game;
  onClick: () => void;
  language?: Language;
  priority?: boolean;
}

const GameCardComponent: React.FC<GameCardProps> = ({ game, onClick, language = "en", priority = false }) => {
  const t = getTranslation(language);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageFailed = Boolean(game.coverImage) && failedImageUrl === game.coverImage;
  const platforms = Array.from(new Set(game.platforms?.filter((platform) => platform.trim()) ?? []));
  const cardPlatforms = platforms.length > 0 ? platforms : ["PC"];
  const [activePlatform, setActivePlatform] = useState(cardPlatforms[0]);
  const selectedPlatform = cardPlatforms.includes(activePlatform) ? activePlatform : cardPlatforms[0];
  const orderedPlatforms = [
    selectedPlatform,
    ...cardPlatforms.filter((platform) => platform !== selectedPlatform),
  ];

  // Achievements calculation
  const totalAchievements = game.achievements.length;
  const unlockedAchievements = game.achievements.filter((a) => a.unlocked).length;
  const achievementProgress = totalAchievements > 0
    ? Math.round((unlockedAchievements / totalAchievements) * 100)
    : 0;

  const isFavorite = isFavoriteGame(game);

  // Status badge styling
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-amber-500/90 text-amber-950", text: "text-amber-200", label: t.statusPendingTag },
    wishlist: { bg: "bg-purple-500/90 text-purple-950", text: "text-purple-200", label: t.statusWishlistTag },
    playing: { bg: "bg-sky-500/90 text-sky-950", text: "text-sky-200", label: t.statusPlayingTag },
    played: { bg: "bg-teal-500/90 text-teal-950", text: "text-teal-200", label: t.statusPlayedTag },
    completed: { bg: "bg-emerald-500/90 text-emerald-950", text: "text-emerald-200", label: t.statusCompletedTag },
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
      onKeyDown={(e) => {
        if (cardPlatforms.length > 1 && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
          e.preventDefault();
          const currentIndex = orderedPlatforms.indexOf(selectedPlatform);
          const direction = e.key === "ArrowRight" ? 1 : -1;
          const nextIndex = (currentIndex + direction + cardPlatforms.length) % cardPlatforms.length;
          setActivePlatform(orderedPlatforms[nextIndex]);
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${game.title} - ${selectedPlatform} (${statusStyle.label}). ${
        cardPlatforms.length > 1
          ? language === "es"
            ? "Usa las flechas izquierda y derecha para cambiar de plataforma."
            : "Use the left and right arrow keys to change platform."
          : ""
      }`}
      className={`group relative w-full cursor-pointer select-none transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${cardPlatforms.length > 1 ? "pt-3" : ""}`}
      id={`card-${game.id}`}
    >
      {orderedPlatforms.map((platformName, index) => {
        const isFrontCard = index === 0;
        const cardPosition = isFrontCard
          ? { position: "relative" as const, zIndex: cardPlatforms.length }
          : {
              position: "absolute" as const,
              top: -Math.min((index - 1) * 3, 6),
              left: 0,
              right: 0,
              zIndex: cardPlatforms.length - index,
              transform: `translateX(${index % 2 === 1 ? 2 : -2}px)`,
            };

        return (
          <div
            key={platformName}
            className={`flex w-full flex-col overflow-hidden rounded-none border border-slate-300 bg-white shadow-md dark:border-white/10 dark:bg-[#161618] sm:rounded-sm ${
              isFrontCard ? "hover:border-indigo-500 hover:shadow-2xl" : "cursor-pointer"
            }`}
            style={cardPosition}
            aria-hidden={isFrontCard ? undefined : true}
            onClick={(event) => {
              if (!isFrontCard) {
                event.stopPropagation();
                setActivePlatform(platformName);
              }
            }}
          >
            <ConsoleBanner platformName={platformName} size="sm" />

            <div
              className="relative flex w-full shrink-0 aspect-[2/3] flex-col justify-between overflow-hidden p-2 sm:p-3"
              style={{ backgroundColor: game.coverColor || "#171717" }}
            >
              {game.coverImage && !imageFailed && (
                <img
                  src={game.coverImage}
                  alt={isFrontCard ? game.title : ""}
                  width={300}
                  height={450}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading={priority ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={priority ? "high" : "auto"}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                    setFailedImageUrl(game.coverImage ?? null);
                  }}
                />
              )}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/20" />

              {(!game.coverImage || imageFailed) && (
                <div className="z-10 my-auto flex flex-col items-center justify-center py-2 sm:py-4">
                  <div className="rounded-full border border-white/20 bg-white/10 p-2.5 shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-110 sm:p-3.5">
                    <GameIcon name={game.coverSymbol} className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]" size={30} />
                  </div>
                </div>
              )}

              <div className="z-10 mt-auto space-y-0.5">
                <p className="truncate text-[9px] font-bold uppercase tracking-widest text-white/70 sm:text-[10px]">
                  {translateGenre(game.genre, language)}
                </p>
                <h3 className="line-clamp-2 text-xs font-black leading-snug tracking-tight text-white drop-shadow-md transition-colors group-hover:text-indigo-300 sm:text-sm">
                  {game.title}
                </h3>
              </div>

              {isFavorite && (
                <div className="absolute right-2 top-2 z-20 border border-white/20 bg-rose-500/90 p-1.5 shadow-md">
                  <Star className="h-3.5 w-3.5 fill-amber-200 text-amber-200" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-100 px-2 py-1.5 font-mono text-[9px] text-neutral-800 dark:border-white/10 dark:bg-[#101012] dark:text-neutral-300 sm:px-3 sm:py-2 sm:text-[11px]">
              <div className="flex items-center gap-1 truncate sm:gap-1.5">
                <Trophy className="h-3 w-3 shrink-0 text-amber-500 dark:text-amber-400 sm:h-3.5 sm:w-3.5" />
                {totalAchievements > 0 ? (
                  <span className="font-semibold text-neutral-800 dark:text-white/90">
                    {unlockedAchievements}/{totalAchievements}
                  </span>
                ) : (
                  <span className="truncate font-sans text-[8px] uppercase text-neutral-500 dark:text-white/50 sm:text-[10px]">
                    {t.noAchievementsRecorded || "Sin Logros"}
                  </span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1 font-bold text-amber-400">
                <span>{totalAchievements > 0 ? `${achievementProgress}%` : ""}</span>
              </div>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
};

export const GameCard = memo(GameCardComponent);
