export interface ConsoleInfo {
  id: string;
  name: string;
  shortName?: string;
  category: "Sony" | "Nintendo" | "Xbox" | "Sega" | "PC & Portable" | "Atari & Retro" | "Arcade & Otros";
  year?: number;
}

export interface ConsoleCategory {
  id: string;
  name: string;
  iconName: string;
}

export const CONSOLE_CATEGORIES: ConsoleCategory[] = [
  { id: "all", name: "Todas", iconName: "Gamepad2" },
  { id: "Sony", name: "PlayStation", iconName: "Tv" },
  { id: "Nintendo", name: "Nintendo", iconName: "Gamepad" },
  { id: "Xbox", name: "Xbox", iconName: "Box" },
  { id: "Sega", name: "Sega", iconName: "Zap" },
  { id: "PC & Portable", name: "PC y Portátiles", iconName: "Laptop" },
  { id: "Atari & Retro", name: "Atari y Clásicas", iconName: "Monitor" },
  { id: "Arcade & Otros", name: "Arcade y Otros", iconName: "Radio" },
];

export const CONSOLES_LIST: ConsoleInfo[] = [
  // --- SONY PLAYSTATION ---
  { id: "ps5", name: "PlayStation 5", shortName: "PS5", category: "Sony", year: 2020 },
  { id: "ps4", name: "PlayStation 4", shortName: "PS4", category: "Sony", year: 2013 },
  { id: "ps3", name: "PlayStation 3", shortName: "PS3", category: "Sony", year: 2006 },
  { id: "ps2", name: "PlayStation 2", shortName: "PS2", category: "Sony", year: 2000 },
  { id: "ps1", name: "PlayStation 1", shortName: "PS1", category: "Sony", year: 1994 },
  { id: "ps-vita", name: "PlayStation Vita", shortName: "PS Vita", category: "Sony", year: 2011 },
  { id: "psp", name: "PlayStation Portable", shortName: "PSP", category: "Sony", year: 2004 },
  { id: "psvr", name: "PlayStation VR", shortName: "PSVR", category: "Sony", year: 2016 },
  { id: "psvr2", name: "PlayStation VR2", shortName: "PSVR2", category: "Sony", year: 2023 },

  // --- NINTENDO ---
  { id: "switch", name: "Nintendo Switch", shortName: "Switch", category: "Nintendo", year: 2017 },
  { id: "wii-u", name: "Nintendo Wii U", shortName: "Wii U", category: "Nintendo", year: 2012 },
  { id: "wii", name: "Nintendo Wii", shortName: "Wii", category: "Nintendo", year: 2006 },
  { id: "gamecube", name: "Nintendo GameCube", shortName: "GameCube", category: "Nintendo", year: 2001 },
  { id: "n64", name: "Nintendo 64", shortName: "N64", category: "Nintendo", year: 1996 },
  { id: "snes", name: "Super Nintendo (SNES)", shortName: "SNES", category: "Nintendo", year: 1990 },
  { id: "nes", name: "Nintendo NES", shortName: "NES", category: "Nintendo", year: 1983 },
  { id: "n3ds", name: "Nintendo 3DS", shortName: "3DS", category: "Nintendo", year: 2011 },
  { id: "nds", name: "Nintendo DS", shortName: "DS", category: "Nintendo", year: 2004 },
  { id: "gba", name: "Game Boy Advance", shortName: "GBA", category: "Nintendo", year: 2001 },
  { id: "gbc", name: "Game Boy Color", shortName: "GBC", category: "Nintendo", year: 1998 },
  { id: "gb", name: "Game Boy", shortName: "Game Boy", category: "Nintendo", year: 1989 },
  { id: "virtual-boy", name: "Virtual Boy", shortName: "Virtual Boy", category: "Nintendo", year: 1995 },
  { id: "game-and-watch", name: "Game & Watch", shortName: "Game & Watch", category: "Nintendo", year: 1980 },

  // --- MICROSOFT XBOX ---
  { id: "xbox-series", name: "Xbox Series X|S", shortName: "Xbox Series", category: "Xbox", year: 2020 },
  { id: "xbox-one", name: "Xbox One", shortName: "Xbox One", category: "Xbox", year: 2013 },
  { id: "xbox-360", name: "Xbox 360", shortName: "Xbox 360", category: "Xbox", year: 2005 },
  { id: "xbox-original", name: "Xbox (Original)", shortName: "Xbox", category: "Xbox", year: 2001 },

  // --- SEGA ---
  { id: "dreamcast", name: "Sega Dreamcast", shortName: "Dreamcast", category: "Sega", year: 1998 },
  { id: "saturn", name: "Sega Saturn", shortName: "Saturn", category: "Sega", year: 1994 },
  { id: "mega-drive", name: "Sega Mega Drive / Genesis", shortName: "Mega Drive", category: "Sega", year: 1988 },
  { id: "master-system", name: "Sega Master System", shortName: "Master System", category: "Sega", year: 1985 },
  { id: "game-gear", name: "Sega Game Gear", shortName: "Game Gear", category: "Sega", year: 1990 },
  { id: "sega-cd", name: "Sega CD", shortName: "Sega CD", category: "Sega", year: 1991 },
  { id: "sega-32x", name: "Sega 32X", shortName: "Sega 32X", category: "Sega", year: 1994 },
  { id: "sg-1000", name: "Sega SG-1000", shortName: "SG-1000", category: "Sega", year: 1983 },

  // --- PC & PORTABLE ---
  { id: "pc", name: "PC", shortName: "PC", category: "PC & Portable", year: 1981 },
  { id: "steam-deck", name: "Steam Deck", shortName: "Steam Deck", category: "PC & Portable", year: 2022 },
  { id: "mac", name: "Mac / macOS", shortName: "Mac", category: "PC & Portable" },
  { id: "linux", name: "Linux", shortName: "Linux", category: "PC & Portable" },
  { id: "ios", name: "iOS", shortName: "iOS", category: "PC & Portable" },
  { id: "android", name: "Android", shortName: "Android", category: "PC & Portable" },
  { id: "meta-quest", name: "Meta Quest / VR", shortName: "VR", category: "PC & Portable" },

  // --- ATARI & RETRO CLÁSICAS ---
  { id: "atari-2600", name: "Atari 2600", shortName: "Atari 2600", category: "Atari & Retro", year: 1977 },
  { id: "atari-5200", name: "Atari 5200", shortName: "Atari 5200", category: "Atari & Retro", year: 1982 },
  { id: "atari-7800", name: "Atari 7800", shortName: "Atari 7800", category: "Atari & Retro", year: 1986 },
  { id: "atari-lynx", name: "Atari Lynx", shortName: "Lynx", category: "Atari & Retro", year: 1989 },
  { id: "atari-jaguar", name: "Atari Jaguar", shortName: "Jaguar", category: "Atari & Retro", year: 1993 },
  { id: "atari-st", name: "Atari ST", shortName: "Atari ST", category: "Atari & Retro", year: 1985 },
  { id: "commodore-64", name: "Commodore 64", shortName: "C64", category: "Atari & Retro", year: 1982 },
  { id: "amiga", name: "Amiga", shortName: "Amiga", category: "Atari & Retro", year: 1985 },
  { id: "ms-dos", name: "MS-DOS", shortName: "MS-DOS", category: "Atari & Retro", year: 1981 },
  { id: "zx-spectrum", name: "ZX Spectrum", shortName: "ZX Spectrum", category: "Atari & Retro", year: 1982 },
  { id: "amstrad-cpc", name: "Amstrad CPC", shortName: "Amstrad", category: "Atari & Retro", year: 1984 },
  { id: "msx", name: "MSX", shortName: "MSX", category: "Atari & Retro", year: 1983 },

  // --- ARCADE & OTROS ---
  { id: "arcade", name: "Arcade / Recreativa", shortName: "Arcade", category: "Arcade & Otros" },
  { id: "neo-geo", name: "Neo Geo (AES / MVS)", shortName: "Neo Geo", category: "Arcade & Otros", year: 1990 },
  { id: "neo-geo-pocket", name: "Neo Geo Pocket", shortName: "NG Pocket", category: "Arcade & Otros", year: 1998 },
  { id: "turbografx", name: "TurboGrafx-16 / PC Engine", shortName: "TurboGrafx", category: "Arcade & Otros", year: 1987 },
  { id: "wonderswan", name: "WonderSwan", shortName: "WonderSwan", category: "Arcade & Otros", year: 1999 },
  { id: "3do", name: "3DO Interactive Multiplayer", shortName: "3DO", category: "Arcade & Otros", year: 1993 },
  { id: "colecovision", name: "ColecoVision", shortName: "ColecoVision", category: "Arcade & Otros", year: 1982 },
  { id: "intellivision", name: "Intellivision", shortName: "Intellivision", category: "Arcade & Otros", year: 1979 },
  { id: "vectrex", name: "Vectrex", shortName: "Vectrex", category: "Arcade & Otros", year: 1982 },
  { id: "magnavox-odyssey", name: "Magnavox Odyssey", shortName: "Odyssey", category: "Arcade & Otros", year: 1972 },
  { id: "retro-varios", name: "Retro / Varios", shortName: "Retro", category: "Arcade & Otros" },
];

export const ALL_CONSOLE_NAMES: string[] = CONSOLES_LIST.map((c) => c.name);

/**
 * Normalizes platform names from external APIs (like IGDB "PC (Microsoft Windows)")
 * or legacy inputs into clean standard names (e.g. "PC").
 */
export function normalizePlatformName(name: string): string {
  if (!name) return "";
  const trimmed = name.trim();

  // Normalize any variation of PC / Microsoft Windows
  if (
    /^pc\s*\((microsoft\s*)?windows\)$/i.test(trimmed) ||
    /^pc\s+(microsoft\s*)?windows$/i.test(trimmed) ||
    /^microsoft\s*windows$/i.test(trimmed) ||
    /^windows\s*pc$/i.test(trimmed) ||
    trimmed.toLowerCase() === "pc (microsoft windows)" ||
    trimmed.toLowerCase() === "pc microsoft windows" ||
    trimmed.toLowerCase() === "microsoft windows" ||
    trimmed.toLowerCase() === "windows"
  ) {
    return "PC";
  }

  // Normalize Mac / macOS
  if (
    /^mac\s*\((apple\s*)?macos\)$/i.test(trimmed) ||
    /^mac\s*os(\s*x)?$/i.test(trimmed) ||
    /^macintosh$/i.test(trimmed) ||
    /^macos$/i.test(trimmed)
  ) {
    return "Mac / macOS";
  }

  return trimmed;
}
