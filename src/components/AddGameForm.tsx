import React, { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Game, GameStatus, Language, IgdbSearchResult } from "../types";
import { ConsolePicker } from "./ConsolePicker";
import { IgdbSearchModal } from "./IgdbSearchModal";
import { GameIcon, AVAILABLE_SYMBOLS } from "./GameIcon";
import { getTranslation, translateSymbolLabel } from "../translations";
import { VideoGameBarcode } from "./VideoGameBarcode";
import * as Icons from "lucide-react";

interface AddGameFormProps {
  language?: Language;
  onClose: () => void;
  onAdd: (newGame: Omit<Game, "id">) => void;
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

export const AddGameForm: React.FC<AddGameFormProps> = ({
  language = "en",
  onClose,
  onAdd,
}) => {
  const t = getTranslation(language);

  // Modal controls
  const [showIgdbModal, setShowIgdbModal] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [releaseDate, setReleaseDate] = useState("");
  const [barcode, setBarcode] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  });
  const [rating, setRating] = useState<number>(0);
  const [playTime, setPlayTime] = useState<number>(0);
  const [status, setStatus] = useState<GameStatus>("Pendiente");
  const [coverColor, setCoverColor] = useState(COLOR_PRESETS[0]);
  const [coverSymbol, setCoverSymbol] = useState("gamepad");
  const [coverImage, setCoverImage] = useState("");
  const [notes, setNotes] = useState("");

  // IGDB metadata
  const [igdbId, setIgdbId] = useState<number | undefined>(undefined);
  const [igdbRating, setIgdbRating] = useState<number | undefined>(undefined);
  const [igdbUrl, setIgdbUrl] = useState<string | undefined>(undefined);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle IGDB Game Selection
  const handleSelectIgdbGame = (result: IgdbSearchResult) => {
    setTitle(result.name);
    if (result.summary) setDescription(result.summary);
    if (result.genres && result.genres.length > 0) {
      setGenre(result.genres.join(", "));
    }
    if (result.platforms && result.platforms.length > 0) {
      setPlatforms(result.platforms);
    }
    if (result.firstReleaseDate) {
      setReleaseDate(result.firstReleaseDate);
    }
    if (result.coverUrl) {
      setCoverImage(result.coverUrl);
    }
    if (result.id) setIgdbId(result.id);
    if (result.rating) setIgdbRating(result.rating);
    if (result.url) setIgdbUrl(result.url);

    setShowIgdbModal(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg(t.titleRequired || "Title is required");
      return;
    }

    const newGame: Omit<Game, "id"> = {
      title: title.trim(),
      description: description.trim(),
      genre: genre.trim(),
      platforms: platforms.length > 0 ? platforms : ["PC"],
      releaseDate: releaseDate.trim(),
      barcode: barcode.trim(),
      acquisitionDate: acquisitionDate || (() => {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${day}/${month}/${year}`;
      })(),
      rating: Number(rating) || 0,
      playTime: Number(playTime) || 0,
      status,
      coverColor,
      coverSymbol,
      coverImage: coverImage.trim() || undefined,
      igdbId,
      igdbRating,
      igdbUrl,
      achievements: [],
      notes: notes.trim() || undefined,
    };

    onAdd(newGame);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto py-4 sm:py-8"
        id="add-game-modal-overlay"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-white dark:bg-[#141417] text-neutral-900 dark:text-white rounded-none border border-neutral-300 dark:border-white/10 shadow-2xl overflow-hidden my-auto"
          id="add-game-modal-content"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-[#1b1b1f]">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-indigo-600 text-white rounded-none">
                <Icons.PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  {t.addGame}
                </h2>
                <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-gray-400 hidden sm:block">
                  {t.addGameSubtitle || "Add a new title to your personal library"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/10 rounded-none transition-colors cursor-pointer"
            >
              <Icons.X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-3.5 sm:space-y-6 max-h-[85vh] overflow-y-auto">
            {/* Quick IGDB Search Banner */}
            <div className="p-2.5 sm:p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 rounded-none flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Icons.Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200 truncate">
                    {t.autoImportIgdb || "Importar de IGDB"}
                  </p>
                  <p className="text-[10px] text-indigo-700 dark:text-indigo-400 truncate">
                    {t.autoImportDesc || "Portada y datos oficiales"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIgdbModal(true)}
                className="px-2.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-none transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                {t.searchIgdb || "Buscar IGDB"}
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-none text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                <Icons.AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Title & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                  {t.gameTitleLabel || "Title"} *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.titlePlaceholder || "e.g. The Legend of Zelda: Tears of the Kingdom"}
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                  {t.statusLabel || "Status"}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as GameStatus)}
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Pendiente">{t.statusPending || "Pending"}</option>
                  <option value="Deseados">{t.wishlistOption || "Quiero Jugar (Lista de Deseos)"}</option>
                  <option value="Jugando">{t.statusPlaying || "Playing"}</option>
                  <option value="Completado">{t.statusCompleted || "Completed"}</option>
                  <option value="Favoritos">{t.statusFavorites || "Favorite"}</option>
                </select>
              </div>
            </div>

            {/* Platforms Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                {t.platformsLabel || "Platforms / Consoles"}
              </label>
              <ConsolePicker
                selectedPlatforms={platforms}
                onChange={setPlatforms}
                language={language}
              />
            </div>

            {/* Genre & Release Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                  {t.genreLabel || "Genre"}
                </label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder={t.genrePlaceholder || "RPG, Action, Adventure"}
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                  {t.releaseDateLabel || "Release Date / Year"}
                </label>
                <input
                  type="text"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  placeholder="dd/mm/yyyy"
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Rating & Playtime */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                  {t.ratingLabel || "Rating (1-5)"}
                </label>
                <div className="flex items-center gap-1 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(rating === star ? 0 : star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Icons.Star
                        size={22}
                        className={star <= rating ? "fill-amber-400 text-amber-400" : "text-neutral-300 dark:text-neutral-600"}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-neutral-500 ml-2">
                    {rating > 0 ? `${rating}/5` : t.notRated || "Not rated"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                  {t.playTimeLabel || "Play Time (Hours)"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={playTime || ""}
                  onChange={(e) => setPlayTime(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Cover customizer (Color / Icon / Custom Image) */}
            <div className="space-y-3 p-4 bg-neutral-50 dark:bg-[#1b1b1f] rounded-none border border-neutral-300 dark:border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-gray-300 flex items-center gap-2">
                <Icons.Palette className="w-4 h-4 text-indigo-500" />
                <span>{t.coverCustomizer || "Cover Customization"}</span>
              </h3>

              {/* Preview Box */}
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-28 rounded-none shadow-md flex flex-col items-center justify-center p-2 text-white relative overflow-hidden shrink-0 border border-white/20"
                  style={{
                    backgroundColor: coverColor,
                    backgroundImage: coverImage ? `url(${coverImage})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {!coverImage && (
                    <>
                      <GameIcon name={coverSymbol} size={32} className="drop-shadow-md mb-1" />
                      <span className="text-[10px] font-bold text-center line-clamp-2 opacity-90 drop-shadow">
                        {title || t.gameTitleLabel || "Title"}
                      </span>
                    </>
                  )}
                </div>

                <div className="space-y-3 flex-1">
                  {/* Cover image URL input */}
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-500 dark:text-gray-400">
                      {t.coverImageUrl || "Cover Image URL (optional)"}
                    </label>
                    <input
                      type="url"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#121212] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Fallback color picker */}
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-500 dark:text-gray-400 block mb-1">
                      {t.coverColorLabel || "Cover Color"}
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setCoverColor(color)}
                          className={`w-6 h-6 rounded-none transition-transform cursor-pointer border border-black/10 ${coverColor.toLowerCase() === color.toLowerCase() ? "ring-2 ring-indigo-500 scale-110 z-10" : ""
                            }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}

                      {/* Custom color picker button */}
                      <label
                        className={`relative w-6 h-6 rounded-none transition-transform cursor-pointer border border-dashed border-neutral-400 dark:border-white/30 flex items-center justify-center bg-white dark:bg-[#121212] hover:border-indigo-500 ${!COLOR_PRESETS.some((c) => c.toLowerCase() === coverColor.toLowerCase())
                          ? "ring-2 ring-indigo-500 scale-110 z-10 border-solid"
                          : ""
                          }`}
                        style={{
                          backgroundColor: !COLOR_PRESETS.some((c) => c.toLowerCase() === coverColor.toLowerCase())
                            ? coverColor
                            : undefined,
                        }}
                        title={t.customColor || "Personalizar color"}
                      >
                        <input
                          type="color"
                          value={coverColor.startsWith("#") && coverColor.length === 7 ? coverColor : "#EAB308"}
                          onChange={(e) => setCoverColor(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Icons.Pipette
                          className={`w-3.5 h-3.5 ${!COLOR_PRESETS.some((c) => c.toLowerCase() === coverColor.toLowerCase())
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
                      {t.coverSymbolLabel || "Cover Icon (Fallback)"}
                    </label>
                    <div className="flex flex-wrap items-center gap-1">
                      {AVAILABLE_SYMBOLS.slice(0, 10).map((sym) => (
                        <button
                          key={sym.id}
                          type="button"
                          onClick={() => setCoverSymbol(sym.icon)}
                          className={`p-1.5 rounded-none border transition-all cursor-pointer ${coverSymbol === sym.icon
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white dark:bg-[#121212] border-neutral-300 dark:border-white/10 text-neutral-600 dark:text-gray-300 hover:border-indigo-500"
                            }`}
                          title={translateSymbolLabel(sym.id, language)}
                        >
                          <GameIcon name={sym.icon} size={16} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Barcode & Acquisition date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                  {t.barcodeLabel || "Código de Barras (EAN / UPC)"}
                </label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder={t.barcodePlaceholder || "EAN / UPC (ej. 0045496598518)"}
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500 font-mono"
                />

                {/* Live Barcode Preview in Add Game Form */}
                {barcode.trim() !== "" && (
                  <div className="mt-2 p-2.5 bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-white/10 rounded-none">
                    <p className="text-[9px] font-mono font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                      {t.barcodePreviewLabel || "Vista Previa de Caja / Cartucho"}
                    </p>
                    <VideoGameBarcode
                      barcode={barcode}
                      platform={platforms[0]}
                      variant="retail-sticker"
                      size="sm"
                      className="mx-auto"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                  {t.acquisitionDateLabel || "Acquisition Date"}
                </label>
                <input
                  type="text"
                  value={acquisitionDate}
                  onChange={(e) => setAcquisitionDate(e.target.value)}
                  placeholder="dd/mm/yyyy"
                  className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                {t.descriptionLabel || "Description / Overview"}
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.descriptionPlaceholder || "Brief summary of the game..."}
                className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Personal Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-neutral-600 dark:text-gray-300">
                {t.notesLabel || "Personal Notes"}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.notesPlaceholder || "Collector notes, physical box location, condition..."}
                className="w-full px-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-neutral-600 dark:text-gray-300 border border-neutral-300 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-none transition-colors cursor-pointer"
              >
                {t.cancelBtn || "Cancel"}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-none transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Icons.Check className="w-4 h-4 stroke-[3]" />
                <span>{t.addGame || "Add Game"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* IGDB Search Modal */}
      <AnimatePresence>
        {showIgdbModal && (
          <IgdbSearchModal
            initialQuery={title}
            onClose={() => setShowIgdbModal(false)}
            onSelectGame={handleSelectIgdbGame}
            language={language}
          />
        )}
      </AnimatePresence>
    </>
  );
};
