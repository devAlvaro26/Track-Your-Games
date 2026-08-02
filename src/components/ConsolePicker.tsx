import React, { useState } from "react";
import { CONSOLES_LIST, CONSOLE_CATEGORIES } from "../consoles";
import { useTranslation } from "../translations";
import { Language } from "../types";
import * as Icons from "lucide-react";

interface ConsolePickerProps {
  selectedPlatforms: string[];
  onChange: (platforms: string[]) => void;
  language?: Language;
}

export const ConsolePicker: React.FC<ConsolePickerProps> = ({
  selectedPlatforms,
  onChange,
  language = "en",
}) => {
  const { t, translateConsoleCategory } = useTranslation(language);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [customConsole, setCustomConsole] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  const togglePlatform = (name: string) => {
    if (selectedPlatforms.includes(name)) {
      onChange(selectedPlatforms.filter((p) => p !== name));
    } else {
      onChange([...selectedPlatforms, name]);
    }
  };

  const handleAddCustomConsole = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!customConsole.trim()) return;
    const name = customConsole.trim();
    if (!selectedPlatforms.includes(name)) {
      onChange([...selectedPlatforms, name]);
    }
    setCustomConsole("");
    setShowCustomInput(false);
  };

  // Filter consoles by category and search term
  const filteredConsoles = CONSOLES_LIST.filter((c) => {
    const matchesCategory =
      activeCategory === "all" || c.category === activeCategory;
    const searchLower = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !searchLower ||
      c.name.toLowerCase().includes(searchLower) ||
      (c.shortName && c.shortName.toLowerCase().includes(searchLower)) ||
      c.category.toLowerCase().includes(searchLower);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-3" id="console-picker-container">
      {/* Selected Consoles Badges */}
      <div className="flex flex-wrap gap-1.5 items-center min-h-[32px] p-2 bg-neutral-100 dark:bg-[#161616] rounded-none border border-neutral-300 dark:border-white/10">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-gray-400 mr-1 flex items-center gap-1">
          <Icons.CheckSquare className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          {t.selectedConsolesLabel} ({selectedPlatforms.length}):
        </span>

        {selectedPlatforms.length === 0 ? (
          <span className="text-xs text-neutral-400 dark:text-gray-500 italic">
            {t.noConsolesSelected}
          </span>
        ) : (
          selectedPlatforms.map((platform) => (
            <span
              key={platform}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-xs font-bold bg-indigo-600 text-white shadow-sm"
            >
              {platform}
              <button
                type="button"
                onClick={() => togglePlatform(platform)}
                className="p-0.5 hover:bg-indigo-700 rounded-none transition-colors cursor-pointer"
                title={t.delete}
              >
                <Icons.X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="space-y-2">
        {/* Search input + Custom add */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Icons.Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder={t.searchConsolePlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-800 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <Icons.X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 dark:text-gray-300 bg-neutral-100 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 hover:border-neutral-400 rounded-none transition-colors cursor-pointer whitespace-nowrap"
          >
            <Icons.Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            {t.addOtherConsole}
          </button>
        </div>

        {/* Custom Console Inline Form */}
        {showCustomInput && (
          <div className="flex gap-2 items-center p-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 rounded-none">
            <input
              type="text"
              placeholder={t.customConsolePlaceholder}
              value={customConsole}
              onChange={(e) => setCustomConsole(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomConsole(e);
                }
              }}
              className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-[#121212] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-800 dark:text-white focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddCustomConsole}
              disabled={!customConsole.trim()}
              className="px-3 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-none transition-colors cursor-pointer"
            >
              {t.add}
            </button>
          </div>
        )}

        {/* Category Pills */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none" id="console-category-pills">
          {CONSOLE_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-none border whitespace-nowrap transition-all cursor-pointer ${isActive
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-neutral-50 dark:bg-[#1b1b1f] text-neutral-600 dark:text-gray-400 border-neutral-300 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-[#25252a]"
                  }`}
              >
                {translateConsoleCategory(cat.id)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Consoles */}
      <div className="max-h-[120px] sm:max-h-[180px] overflow-y-auto p-1.5 sm:p-2 bg-neutral-50 dark:bg-[#121212] rounded-none border border-neutral-300 dark:border-white/10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5" id="consoles-grid">
        {filteredConsoles.length === 0 ? (
          <div className="col-span-full text-center py-4 text-xs text-neutral-400">
            {t.noConsolesFound}
          </div>
        ) : (
          filteredConsoles.map((c) => {
            const isSelected = selectedPlatforms.includes(c.name);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => togglePlatform(c.name)}
                className={`text-left text-xs px-2.5 py-1.5 rounded-none border font-medium transition-all flex items-center justify-between cursor-pointer ${isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm"
                    : "bg-white dark:bg-[#1b1b1f] text-neutral-700 dark:text-gray-300 border-neutral-300 dark:border-white/10 hover:border-indigo-500 hover:bg-neutral-100 dark:hover:bg-[#25252a]"
                  }`}
              >
                <span className="truncate">{c.name}</span>
                {isSelected && <Icons.Check className="w-3 h-3 ml-1 shrink-0 text-white" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
