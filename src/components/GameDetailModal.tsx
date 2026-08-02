import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Game, Achievement, GameStatus, Language, IgdbSearchResult } from "../types";
import { GameIcon, AVAILABLE_SYMBOLS } from "./GameIcon";
import { ConsolePicker } from "./ConsolePicker";
import { IgdbSearchModal } from "./IgdbSearchModal";
import { getTranslation, translateGenre, translateSymbolLabel } from "../translations";
import * as Icons from "lucide-react";

interface GameDetailModalProps {
  game: Game;
  onClose: () => void;
  onUpdate: (game: Game) => void;
  onDelete: (id: string) => void;
  language?: Language;
}

const COLOR_PRESETS = [
  "#4F46E5", // Indigo
  "#0284C7", // Sky
  "#059669", // Emerald
  "#EAB308", // Yellow
  "#D97706", // Amber
  "#E11D48", // Rose
  "#7C3AED", // Violet
  "#2563EB", // Blue
  "#0D9488", // Teal
  "#171717", // Dark Neutral
  "#475569", // Slate
];

export const GameDetailModal: React.FC<GameDetailModalProps> = ({ game, onClose, onUpdate, onDelete, language = "en" }) => {
  const t = getTranslation(language);

  const [isEditing, setIsEditing] = useState(false);
  const [showIgdbModal, setShowIgdbModal] = useState(false);
  const [editImportNotice, setEditImportNotice] = useState("");
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);

  // Close enlarged image on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isImageEnlarged) {
        setIsImageEnlarged(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImageEnlarged]);

  // Convert IGDB image URLs to high-res 1080p quality for lightboxes
  const getHighResCoverUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    if (url.includes("images.igdb.com")) {
      return url.replace(/t_(cover_big|thumb|crop_3d|cover_small|logo_med|micro|screenshot_med|cover_big_2x)/g, "t_1080p");
    }
    return url;
  };

  const [editTitle, setEditTitle] = useState(game.title);
  const [editDescription, setEditDescription] = useState(game.description);
  const [editGenre, setEditGenre] = useState(game.genre);
  const [editBarcode, setEditBarcode] = useState(game.barcode);
  const [editAcquisitionDate, setEditAcquisitionDate] = useState(game.acquisitionDate);
  const [editReleaseDate, setEditReleaseDate] = useState(game.releaseDate);
  const [editRating, setEditRating] = useState(game.rating);
  const [editPlayTime, setEditPlayTime] = useState(game.playTime);
  const [editStatus, setEditStatus] = useState(game.status);
  const [editCoverColor, setEditCoverColor] = useState(game.coverColor);
  const [editCoverSymbol, setEditCoverSymbol] = useState(game.coverSymbol);
  const [editCoverImage, setEditCoverImage] = useState(game.coverImage || "");
  const [editIgdbId, setEditIgdbId] = useState<number | undefined>(game.igdbId);
  const [editIgdbRating, setEditIgdbRating] = useState<number | undefined>(game.igdbRating);
  const [editIgdbUrl, setEditIgdbUrl] = useState<string | undefined>(game.igdbUrl);
  const [editNotes, setEditNotes] = useState(game.notes || "");
  const [editPlatforms, setEditPlatforms] = useState<string[]>(game.platforms);

  // Toggle achievement unlock status
  const handleToggleAchievement = (achievementId: string) => {
    const updatedAchievements = game.achievements.map((ach) => {
      if (ach.id === achievementId) {
        const nextUnlocked = !ach.unlocked;
        return {
          ...ach,
          unlocked: nextUnlocked,
          unlockedAt: nextUnlocked ? new Date().toISOString().split("T")[0] : undefined,
        };
      }
      return ach;
    });

    onUpdate({
      ...game,
      achievements: updatedAchievements,
    });
  };

  // Quick save for notes/hours/rating in view mode
  const handleSaveQuickEdits = (field: keyof Game, value: any) => {
    onUpdate({
      ...game,
      [field]: value,
    });
  };

  // Full save from editing form
  const handleSaveFullEdit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...game,
      title: editTitle.trim(),
      description: editDescription.trim(),
      genre: editGenre.trim(),
      barcode: editBarcode.trim(),
      acquisitionDate: editAcquisitionDate,
      releaseDate: editReleaseDate,
      rating: editRating,
      playTime: Number(editPlayTime),
      status: editStatus,
      coverColor: editCoverColor,
      coverSymbol: editCoverSymbol,
      coverImage: editCoverImage.trim() || undefined,
      igdbId: editIgdbId,
      igdbRating: editIgdbRating,
      igdbUrl: editIgdbUrl,
      platforms: editPlatforms,
      notes: editNotes.trim(),
    });
    setIsEditing(false);
  };

  // Handle game select from IGDB modal while editing
  const handleSelectIgdbGame = (selected: IgdbSearchResult) => {
    setShowIgdbModal(false);
    if (selected.name) setEditTitle(selected.name);
    if (selected.summary) setEditDescription(selected.summary);
    if (selected.firstReleaseDate) setEditReleaseDate(selected.firstReleaseDate);
    if (selected.genres && selected.genres.length > 0) setEditGenre(selected.genres[0]);
    if (selected.platforms && selected.platforms.length > 0) setEditPlatforms(selected.platforms);
    if (selected.coverUrl) setEditCoverImage(selected.coverUrl);
    if (selected.id) setEditIgdbId(selected.id);
    if (selected.rating) setEditIgdbRating(selected.rating);
    if (selected.url) setEditIgdbUrl(selected.url);

    setEditImportNotice(t.igdbImportSuccess.replace("{name}", selected.name || ""));
  };

  // Helper to render vector EAN-13 barcode
  const renderBarcodeSVG = (code: string) => {
    const cleanCode = code.replace(/[^0-9]/g, "") || "0000000000000";
    const bars: boolean[] = [];
    bars.push(true, false, true);

    for (let i = 0; i < cleanCode.length; i++) {
      const digit = parseInt(cleanCode[i] || "0");
      const pattern = [
        [true, false, true, false, false],
        [true, true, false, false, true],
        [true, false, true, true, false],
        [false, true, true, false, true],
        [true, false, false, true, true],
        [false, true, false, true, true],
        [true, true, false, true, false],
        [true, false, true, false, true],
        [false, false, true, true, true],
        [true, true, true, false, false],
      ][digit % 10];

      bars.push(...pattern);
      if (i === 5) {
        bars.push(false, true, false, true, false);
      }
    }
    bars.push(true, false, true);

    return (
      <div className="flex flex-col items-center bg-white p-3 rounded-none border border-neutral-300 shadow-sm max-w-[180px] mx-auto select-none">
        <svg viewBox="0 0 100 40" className="w-full h-10">
          <g fill="#000000">
            {bars.map((isBlack, index) => {
              if (isBlack) {
                return (
                  <rect
                    key={index}
                    x={(index * 1.1) + 2}
                    y="1"
                    width="0.9"
                    height="32"
                  />
                );
              }
              return null;
            })}
          </g>
        </svg>
        <div className="font-mono text-[9px] tracking-[3px] text-black mt-1 text-center font-bold">
          {cleanCode.substring(0, 1)} {cleanCode.substring(1, 7)} {cleanCode.substring(7, 13)}
        </div>
      </div>
    );
  };

  // Achievement ratios
  const totalAchievements = game.achievements.length;
  const unlockedCount = game.achievements.filter((a) => a.unlocked).length;
  const progressPercent = totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;
  const locale = language === "en" ? "en-US" : "es-ES";

  return (
    <>
      {showIgdbModal && (
        <IgdbSearchModal
          initialQuery={editTitle}
          onClose={() => setShowIgdbModal(false)}
          onSelectGame={handleSelectIgdbGame}
          language={language}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm overflow-hidden" id="detail-modal-container">

        {/* Container */}
        <motion.div
          layoutId={`game-card-${game.id}`}
          className={`relative w-full ${isEditing ? "max-w-3xl" : "max-w-4xl"} bg-white dark:bg-[#141417] text-neutral-900 dark:text-white rounded-none border border-neutral-300 dark:border-white/10 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col my-auto`}
          id="detail-modal"
        >

          <AnimatePresence mode="wait">
            {!isEditing ? (
              /* ================= VIEW MODE ================= */
              <div className="flex flex-col md:flex-row h-full overflow-y-auto max-h-[95vh]">

                {/* Left Pane: Interactive Cover & Barcode Side */}
                <div
                  className="w-full md:w-1/3 p-3.5 sm:p-6 flex flex-col justify-between text-white relative min-h-0 md:min-h-[400px] overflow-hidden shrink-0"
                  style={{ backgroundColor: game.coverColor }}
                >
                  {/* High-res IGDB Cover Background Image if available */}
                  {game.coverImage ? (
                    <img
                      src={game.coverImage}
                      alt={game.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}

                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 pointer-events-none" />

                  {/* Top Bar: Platforms & Action buttons */}
                  <div className="z-10 flex justify-between items-start gap-2 mb-2">
                    <div className="flex flex-wrap gap-1 flex-1 min-w-0 pr-1 items-center">
                      {game.platforms && game.platforms.length > 0 ? (
                        game.platforms.map((plat) => (
                          <span
                            key={plat}
                            className="text-[9px] sm:text-[10px] font-bold tracking-wider text-white uppercase px-1.5 py-0.5 sm:px-2 rounded-none bg-white/15 backdrop-blur-md shadow-sm border border-white/20 whitespace-nowrap"
                          >
                            {plat}
                          </span>
                        ))
                      ) : (
                        <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-white uppercase px-1.5 py-0.5 sm:px-2 rounded-none bg-white/15 backdrop-blur-md shadow-sm border border-white/20">
                          PC
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 rounded-none bg-black/40 hover:bg-black/60 border border-white/25 transition-all cursor-pointer text-white shadow-sm"
                        title={t.edit}
                        id="btn-edit-mode"
                      >
                        <Icons.Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`${t.confirmDeleteGame}`)) {
                            onDelete(game.id);
                          }
                        }}
                        className="p-1.5 rounded-none bg-black/40 hover:bg-rose-600/90 border border-white/25 transition-all cursor-pointer text-white shadow-sm"
                        title={t.delete}
                        id="btn-delete-game"
                      >
                        <Icons.Trash className="w-4 h-4" />
                      </button>
                      <button
                        onClick={onClose}
                        className="p-1.5 rounded-none bg-black/40 hover:bg-black/60 border border-white/25 transition-all cursor-pointer text-white shadow-sm"
                        id="close-detail-modal"
                        title={t.close}
                      >
                        <Icons.X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Cover Display & Main Details (Compact row on mobile, centered block on desktop) */}
                  <div className="z-10 flex flex-row md:flex-col items-center md:justify-center my-2 sm:my-4 md:my-6 gap-3 md:gap-0">
                    {game.coverImage ? (
                      <div
                        onClick={() => setIsImageEnlarged(true)}
                        className="relative group w-20 h-28 sm:w-28 sm:h-36 md:w-36 md:h-48 shrink-0 rounded-none overflow-hidden shadow-xl border-2 border-white/20 my-1 md:my-2 cursor-pointer transition-all duration-300 hover:scale-105 hover:border-indigo-400 hover:shadow-indigo-500/20"
                        id="btn-enlarge-cover-image"
                      >
                        <img
                          src={game.coverImage}
                          alt={game.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        {/* Hover Overlay with Zoom Icon */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white gap-1.5 backdrop-blur-[2px] p-2 text-center">
                          <Icons.Maximize2 className="w-5 h-5 stroke-[2.5] text-indigo-300 drop-shadow-md animate-pulse" />
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setIsImageEnlarged(true)}
                        className="relative group p-4 sm:p-6 shrink-0 rounded-none bg-white/15 backdrop-blur-md border border-white/20 shadow-xl mb-0 md:mb-4 cursor-pointer hover:bg-white/25 transition-all duration-300 hover:scale-105"
                        id="btn-enlarge-cover-symbol"
                      >
                        <GameIcon name={game.coverSymbol} className="text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.3)] transition-transform duration-300 group-hover:scale-110" size={40} />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white gap-1 p-2 text-center rounded-none backdrop-blur-[2px]">
                          <Icons.Maximize2 className="w-4 h-4 stroke-[2.5] text-indigo-300" />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col items-start md:items-center text-left md:text-center min-w-0 flex-1">
                      <h1 className="text-lg sm:text-2xl font-black tracking-tight leading-tight px-0 md:px-2 text-white md:mt-2 line-clamp-2">
                        {game.title}
                      </h1>

                      <div className="flex items-center gap-1.5 mt-1 sm:mt-2 flex-wrap justify-start md:justify-center">
                        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/70">
                          {translateGenre(game.genre, language)}
                        </span>
                        {game.igdbRating !== undefined && (
                          <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-none bg-indigo-600 text-white backdrop-blur-md flex items-center gap-1 shadow-sm border border-white/20">
                            <Icons.Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                            {game.igdbRating}/100
                          </span>
                        )}
                      </div>

                      {game.igdbUrl && (
                        <a
                          href={game.igdbUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-[10px] sm:text-[11px] text-indigo-200 hover:text-white underline flex items-center gap-1 transition-colors"
                        >
                          <Icons.ExternalLink className="w-3 h-3" />
                          {t.viewOnIgdb}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Simulated Spine Barcode & Dates */}
                  <div className="z-10 mt-auto pt-2.5 sm:pt-4 border-t border-white/15 space-y-2 sm:space-y-3">
                    {game.barcode && game.barcode.trim() !== "" ? (
                      <div>
                        <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-white/50 text-center mb-0.5 sm:mb-1">
                          {t.officialBarcodeTitle}
                        </p>
                        {renderBarcodeSVG(game.barcode)}
                      </div>
                    ) : (
                      <div className="text-center py-1 sm:py-2">
                        <p className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-white/40 mb-0.5">
                          {t.officialBarcodeTitle}
                        </p>
                        <p className="text-[11px] sm:text-xs text-white/50 italic font-mono">
                          {t.noBarcodeText}
                        </p>
                      </div>
                    )}
                    <div className="flex justify-around items-center text-[11px] sm:text-xs text-white/80">
                      <div className="text-center">
                        <p className="text-[8px] sm:text-[9px] font-bold text-white/40 uppercase">{t.acquiredLabel}</p>
                        <p className="font-semibold">{game.acquisitionDate || t.noDateText}</p>
                      </div>
                      <div className="w-px h-5 sm:h-6 bg-white/15" />
                      <div className="text-center">
                        <p className="text-[8px] sm:text-[9px] font-bold text-white/40 uppercase">{t.releaseLabel}</p>
                        <p className="font-semibold">{game.releaseDate || t.noDateText}</p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Pane: Detailed Logs, Achievements checklist, Ratings */}
                <div className="flex-1 p-3.5 sm:p-8 bg-neutral-50 dark:bg-[#121212] space-y-3.5 sm:space-y-6 overflow-y-auto max-h-[750px]">

                  {/* Meta Summary Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4" id="stats-summary-row">
                    <div className="bg-white dark:bg-[#1b1b1f] p-3.5 rounded-none border border-neutral-300 dark:border-white/10 shadow-sm">
                      <p className="text-[10px] uppercase font-bold text-neutral-500 dark:text-gray-400 mb-0.5 flex items-center gap-1">
                        <Icons.Play className="w-3 h-3 text-sky-500" />
                        {t.statusLabel}
                      </p>
                      <select
                        value={game.status}
                        onChange={(e) => handleSaveQuickEdits("status", e.target.value as GameStatus)}
                        className="bg-transparent text-sm font-bold text-neutral-800 dark:text-white focus:outline-none cursor-pointer w-full"
                      >
                        <option value="Pendiente">{t.statusPendingTag}</option>
                        <option value="Deseados">{t.statusWishlistTag || "Quiero Jugar"}</option>
                        <option value="Jugando">{t.statusPlayingTag}</option>
                        <option value="Completado">{t.statusCompletedTag}</option>
                        <option value="Favoritos">{t.statusFavoriteTag}</option>
                      </select>
                    </div>

                    <div className="bg-white dark:bg-[#1b1b1f] p-3.5 rounded-none border border-neutral-300 dark:border-white/10 shadow-sm">
                      <p className="text-[10px] uppercase font-bold text-neutral-500 dark:text-gray-400 mb-0.5 flex items-center gap-1">
                        <Icons.Clock className="w-3 h-3 text-emerald-500" />
                        {t.playHoursLabel}
                      </p>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={game.playTime}
                          onChange={(e) => handleSaveQuickEdits("playTime", Math.max(0, Number(e.target.value)))}
                          className="bg-transparent text-sm font-bold text-neutral-800 dark:text-white focus:outline-none w-14 border-b border-dashed border-neutral-300 dark:border-white/20"
                        />
                        <span className="text-xs text-neutral-500 font-semibold">{t.hours}</span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-[#1b1b1f] p-3.5 rounded-none border border-neutral-300 dark:border-white/10 shadow-sm">
                      <p className="text-[10px] uppercase font-bold text-neutral-500 dark:text-gray-400 mb-0.5 flex items-center gap-1">
                        <Icons.Award className="w-3 h-3 text-amber-500" />
                        {t.rating}
                      </p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleSaveQuickEdits("rating", star)}
                            className="cursor-pointer hover:scale-110 transition-transform"
                          >
                            <Icons.Star
                              className={`w-4 h-4 ${star <= game.rating ? "text-amber-400 fill-amber-400" : "text-neutral-300 dark:text-gray-700"}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-gray-400 mb-2">
                      {t.gameSummaryTitle}
                    </h3>
                    <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed bg-white dark:bg-[#1b1b1f] p-4 rounded-none border border-neutral-300 dark:border-white/10 shadow-sm">
                      {game.description || t.noDescriptionProvided}
                    </p>
                  </div>

                  {/* Achievements Progress & Checklist */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Icons.Trophy className="w-3.5 h-3.5 text-indigo-500" />
                        {t.achievementsObtainedTitle} ({unlockedCount}/{totalAchievements})
                      </h3>
                      {totalAchievements > 0 && (
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {progressPercent}% {t.percentCompletedText}
                        </span>
                      )}
                    </div>

                    {totalAchievements > 0 && (
                      <div className="w-full bg-neutral-200 dark:bg-[#1b1b1f] h-2.5 rounded-none overflow-hidden mb-4 border border-neutral-300 dark:border-white/10">
                        <div
                          className="bg-indigo-600 h-full rounded-none transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    )}

                    {game.achievements.length === 0 ? (
                      <div className="text-center py-4 bg-white dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-xs text-neutral-400 p-4">
                        {t.noAchievementsDetailHint}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="achievements-checklist-grid">
                        {game.achievements.map((ach) => (
                          <div
                            key={ach.id}
                            onClick={() => handleToggleAchievement(ach.id)}
                            className={`p-3.5 rounded-none border transition-all cursor-pointer flex gap-3 items-start select-none ${ach.unlocked
                              ? "bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800/60"
                              : "bg-white dark:bg-[#1b1b1f] border-neutral-300 dark:border-white/10 hover:border-neutral-400 dark:hover:border-white/20"
                              }`}
                          >
                            <div className="mt-0.5">
                              {ach.unlocked ? (
                                <div className="p-1 bg-indigo-600 text-white rounded-none">
                                  <Icons.Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="p-1 border-2 border-neutral-300 dark:border-white/20 rounded-none w-[22px] h-[22px]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center gap-2 mb-0.5">
                                <h4 className={`text-xs font-bold truncate ${ach.unlocked ? "text-indigo-900 dark:text-indigo-300" : "text-neutral-800 dark:text-neutral-200"}`}>
                                  {ach.name}
                                </h4>
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-none ${ach.difficulty === "Fácil"
                                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-200 dark:border-emerald-800/40"
                                  : ach.difficulty === "Medio"
                                    ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-200 dark:border-amber-800/40"
                                    : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-200 dark:border-rose-800/40"
                                  }`}>
                                  {ach.difficulty === "Fácil" ? t.difficultyEasy : ach.difficulty === "Medio" ? t.difficultyMedium : t.difficultyHard}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-500 dark:text-[#CCCCCC] line-clamp-2 leading-snug">
                                {ach.description}
                              </p>
                              {ach.unlocked && ach.unlockedAt && (
                                <span className="text-[9px] text-indigo-600/70 dark:text-indigo-400/70 font-semibold block mt-1">
                                  {t.unlockedOnDate} {new Date(ach.unlockedAt).toLocaleDateString(locale)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ) : (
              /* ================= EDIT MODE ================= */
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-[#1b1b1f]">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-indigo-600 text-white rounded-none">
                      <Icons.Edit3 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                        {t.editGameDetailsTitle || "Editar Detalles de Juego"}
                      </h2>
                      <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-gray-400 hidden sm:block">
                        {t.editGameSubtitle || "Modifica la información del título en tu biblioteca personal"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/10 rounded-none transition-colors cursor-pointer"
                  >
                    <Icons.X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveFullEdit} className="p-3.5 sm:p-6 space-y-3.5 sm:space-y-6 max-h-[80vh] overflow-y-auto">
                  {/* Quick IGDB Search Banner */}
                  <div className="p-2.5 sm:p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 rounded-none flex flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icons.Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200 truncate">
                          {t.autoImportIgdb || "Importar datos automáticamente"}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-indigo-700 dark:text-indigo-400 hidden sm:block">
                          {t.autoImportDesc || "Busca en la base de datos de IGDB los detalles oficiales y portada"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowIgdbModal(true)}
                      className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-none transition-colors cursor-pointer shrink-0 shadow-sm"
                    >
                      {t.searchIgdb || "Buscar en IGDB"}
                    </button>
                  </div>

                  {editImportNotice && (
                    <div className="p-2.5 sm:p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-none text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Icons.CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="font-semibold text-[11px] sm:text-xs">{editImportNotice}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditImportNotice("")}
                        className="text-emerald-600 dark:text-emerald-400 hover:opacity-75 transition-opacity cursor-pointer"
                      >
                        <Icons.X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Title & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                        {t.gameTitleLabel || "Título"} *
                      </label>
                      <input
                        type="text"
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder={t.titlePlaceholder || "ej. The Legend of Zelda: Tears of the Kingdom"}
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                        {t.statusLabel || "Estado"}
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as GameStatus)}
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-bold"
                      >
                        <option value="Pendiente">{t.statusPending || t.statusPendingTag || "Pendiente"}</option>
                        <option value="Deseados">{t.statusWishlist || t.statusWishlistTag || "Quiero Jugar"}</option>
                        <option value="Jugando">{t.statusPlaying || t.statusPlayingTag || "Jugando"}</option>
                        <option value="Completado">{t.statusCompleted || t.statusCompletedTag || "Completado"}</option>
                        <option value="Favoritos">{t.statusFavorites || t.statusFavoriteTag || "Favoritos"}</option>
                      </select>
                    </div>
                  </div>

                  {/* Platforms Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                      {t.platformsLabel || "Plataformas / Consolas"}
                    </label>
                    <ConsolePicker
                      selectedPlatforms={editPlatforms}
                      onChange={setEditPlatforms}
                      language={language}
                    />
                  </div>

                  {/* Genre & Release Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                        {t.genreLabel || "Género"}
                      </label>
                      <input
                        type="text"
                        value={editGenre}
                        onChange={(e) => setEditGenre(e.target.value)}
                        placeholder={t.genrePlaceholder || "RPG, Acción, Aventura"}
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                        {t.releaseDateLabel || "Fecha o Año de Lanzamiento"}
                      </label>
                      <input
                        type="text"
                        value={editReleaseDate}
                        onChange={(e) => setEditReleaseDate(e.target.value)}
                        placeholder="YYYY-MM-DD or 2023"
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Rating & Playtime */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                        {t.ratingLabel || "Calificación (1-5)"}
                      </label>
                      <div className="flex items-center gap-1 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditRating(editRating === star ? 0 : star)}
                            className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Icons.Star
                              size={20}
                              className={star <= editRating ? "fill-amber-400 text-amber-400" : "text-neutral-300 dark:text-neutral-600"}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-neutral-500 ml-2">
                          {editRating > 0 ? `${editRating}/5` : t.notRated || "Sin calificar"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                        {t.playTimeLabel || "Horas de Juego"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={editPlayTime || ""}
                        onChange={(e) => setEditPlayTime(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Cover customizer (Color / Icon / Custom Image) */}
                  <div className="space-y-2.5 sm:space-y-3 p-3 sm:p-4 bg-neutral-50 dark:bg-[#1b1b1f] rounded-none border border-neutral-300 dark:border-white/10">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-gray-300 flex items-center gap-2">
                      <Icons.Palette className="w-4 h-4 text-indigo-500" />
                      <span>{t.coverCustomizer || "Personalización de Portada"}</span>
                    </h3>

                    {/* Preview Box */}
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                      <div
                        className="w-16 h-22 sm:w-20 sm:h-28 rounded-none shadow-md flex flex-col items-center justify-center p-2 text-white relative overflow-hidden shrink-0 border border-white/20 self-center sm:self-start"
                        style={{
                          backgroundColor: editCoverColor,
                          backgroundImage: editCoverImage ? `url(${editCoverImage})` : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        {!editCoverImage && (
                          <>
                            <GameIcon name={editCoverSymbol} size={28} className="drop-shadow-md mb-1" />
                            <span className="text-[9px] font-bold text-center line-clamp-2 opacity-90 drop-shadow">
                              {editTitle || game.title || t.gameTitleLabel || "Título"}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="space-y-2.5 sm:space-y-3 flex-1 w-full">
                        {/* Cover image URL input */}
                        <div>
                          <label className="text-[11px] font-semibold text-neutral-500 dark:text-gray-400">
                            {t.coverImageUrl || "URL de la Portada (opcional)"}
                          </label>
                          <input
                            type="url"
                            value={editCoverImage}
                            onChange={(e) => setEditCoverImage(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#121212] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* Fallback color picker */}
                        <div>
                          <label className="text-[11px] font-semibold text-neutral-500 dark:text-gray-400 block mb-1">
                            {t.coverColorLabel || "Color de Portada"}
                          </label>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {COLOR_PRESETS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setEditCoverColor(color)}
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-none transition-transform cursor-pointer border border-black/10 ${editCoverColor.toLowerCase() === color.toLowerCase() ? "ring-2 ring-indigo-500 scale-110 z-10" : ""
                                  }`}
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}

                            {/* Custom color picker button */}
                            <label
                              className={`relative w-5 h-5 sm:w-6 sm:h-6 rounded-none transition-transform cursor-pointer border border-dashed border-neutral-400 dark:border-white/30 flex items-center justify-center bg-white dark:bg-[#121212] hover:border-indigo-500 ${!COLOR_PRESETS.some((c) => c.toLowerCase() === editCoverColor.toLowerCase())
                                  ? "ring-2 ring-indigo-500 scale-110 z-10 border-solid"
                                  : ""
                                }`}
                              style={{
                                backgroundColor: !COLOR_PRESETS.some((c) => c.toLowerCase() === editCoverColor.toLowerCase())
                                  ? editCoverColor
                                  : undefined,
                              }}
                              title={t.customColor || "Personalizar color"}
                            >
                              <input
                                type="color"
                                value={editCoverColor.startsWith("#") && editCoverColor.length === 7 ? editCoverColor : "#EAB308"}
                                onChange={(e) => setEditCoverColor(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <Icons.Pipette
                                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${!COLOR_PRESETS.some((c) => c.toLowerCase() === editCoverColor.toLowerCase())
                                    ? "text-white drop-shadow"
                                    : "text-neutral-600 dark:text-neutral-300"
                                  }`}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Icon symbol picker */}
                        <div>
                          <label className="text-[11px] font-semibold text-neutral-500 dark:text-gray-400 block mb-1">
                            {t.coverSymbolLabel || "Icono de Portada"}
                          </label>
                          <div className="flex flex-wrap items-center gap-1">
                            {AVAILABLE_SYMBOLS.slice(0, 10).map((sym) => (
                              <button
                                key={sym.id}
                                type="button"
                                onClick={() => setEditCoverSymbol(sym.icon)}
                                className={`p-1.5 rounded-none border transition-all cursor-pointer ${editCoverSymbol === sym.icon
                                  ? "bg-indigo-600 text-white border-indigo-600"
                                  : "bg-white dark:bg-[#121212] border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-gray-300 hover:border-indigo-500"
                                  }`}
                                title={translateSymbolLabel(sym.id, language)}
                              >
                                <GameIcon name={sym.icon} size={14} />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Barcode & Acquisition date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                        {t.barcodeLabel || "Código de Barras (EAN / UPC)"}
                      </label>
                      <input
                        type="text"
                        value={editBarcode}
                        onChange={(e) => setEditBarcode(e.target.value)}
                        placeholder="EAN / UPC / ISBN"
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                        {t.acquisitionDateLabel || "Fecha de Adquisición"}
                      </label>
                      <input
                        type="date"
                        value={editAcquisitionDate}
                        onChange={(e) => setEditAcquisitionDate(e.target.value)}
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                      {t.descriptionLabel || "Descripción"}
                    </label>
                    <textarea
                      rows={2}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder={t.descriptionPlaceholder || "Breve resumen del juego..."}
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Personal Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                      {t.notesLabel || "Notas Personales"}
                    </label>
                    <textarea
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder={t.notesPlaceholder || "Notas de coleccionista, ubicación..."}
                      className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Submit & Cancel Buttons */}
                  <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-3 sm:pt-4 border-t border-neutral-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-2.5 text-xs font-bold text-neutral-600 dark:text-gray-300 border border-neutral-300 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-none transition-colors cursor-pointer"
                    >
                      {t.cancelBtn || t.cancel || "Cancelar"}
                    </button>
                    <button
                      type="submit"
                      disabled={!editTitle.trim()}
                      className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 dark:disabled:text-neutral-500 rounded-none shadow-sm transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Icons.Check className="w-4 h-4 stroke-[3]" />
                      <span>{t.saveSettings || t.save || "Guardar Cambios"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>

      {showIgdbModal && (
        <IgdbSearchModal
          initialQuery={editTitle || game.title}
          language={language}
          onClose={() => setShowIgdbModal(false)}
          onSelectGame={handleSelectIgdbGame}
        />
      )}

      {/* FULL-SIZE IMAGE LIGHTBOX OVERLAY */}
      <AnimatePresence>
        {isImageEnlarged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl p-4 sm:p-8 select-none overflow-hidden"
            onClick={() => setIsImageEnlarged(false)}
            id="enlarged-image-lightbox"
          >
            {/* Header / Top Control Bar */}
            <div
              className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-auto max-w-7xl mx-auto w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 bg-black/70 backdrop-blur-md px-4 py-2 rounded-none border border-white/20 shadow-lg">
                <Icons.Maximize2 className="w-4 h-4 text-indigo-400" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white leading-none">{game.title}</span>
                  <span className="text-[10px] text-white/60 uppercase tracking-wider font-mono mt-0.5">
                    {t.enlargedImageTitle || "Imagen en tamaño completo"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {game.coverImage && (
                  <a
                    href={game.coverImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 text-white/80 hover:text-white bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-none border border-white/20 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-lg"
                    title={t.openOriginalImage || "Abrir imagen original"}
                  >
                    <Icons.ExternalLink className="w-4 h-4 text-indigo-300" />
                    <span className="hidden sm:inline">{t.openOriginalImage || "Abrir original"}</span>
                  </a>
                )}
                <button
                  onClick={() => setIsImageEnlarged(false)}
                  className="p-2.5 text-white/80 hover:text-white bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-none border border-white/20 transition-all cursor-pointer shadow-lg"
                  title={t.close || "Cerrar"}
                  id="close-enlarged-image"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Central Image Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative max-w-full max-h-[82vh] flex items-center justify-center my-auto pointer-events-auto p-2"
              onClick={(e) => e.stopPropagation()}
            >
              {game.coverImage ? (
                <img
                  src={getHighResCoverUrl(game.coverImage)}
                  alt={game.title}
                  onError={(e) => {
                    // Fallback to original image URL if high-res 1080p fails
                    const target = e.target as HTMLImageElement;
                    if (game.coverImage && target.src !== game.coverImage) {
                      target.src = game.coverImage;
                    }
                  }}
                  className="max-h-[78vh] max-w-[90vw] object-contain rounded-none border-2 border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="p-12 sm:p-16 rounded-none flex flex-col items-center justify-center border-2 border-white/20 shadow-2xl min-w-[280px]"
                  style={{ backgroundColor: game.coverColor || "#171717" }}
                >
                  <GameIcon name={game.coverSymbol} className="text-white drop-shadow-[0_4px_16px_rgba(255,255,255,0.4)] mb-4" size={110} />
                  <h2 className="text-2xl font-black text-white text-center tracking-tight">{game.title}</h2>
                </div>
              )}
            </motion.div>

            {/* Bottom Keyboard Hint */}
            <div className="absolute bottom-4 text-[11px] font-mono text-white/60 bg-black/60 backdrop-blur-md px-3.5 py-1.5 border border-white/15 rounded-none pointer-events-none shadow-md">
              {t.pressEscToClose || "Presiona ESC o haz clic en cualquier lugar para cerrar"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
