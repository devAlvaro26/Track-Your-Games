import React from "react";

interface ConsoleLogoProps {
  platformName?: string;
  brandKey?: string;
  size?: number | string;
  className?: string;
}

// Vite eager import of all 600+ SVG files from src/lib/svg/ as raw text
const svgModules = import.meta.glob("../lib/svg/*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

// Mapping dictionary from platform name / ID to SVG filename in src/lib/svg
const PLATFORM_TO_SVG: Record<string, string> = {
  // Sony PlayStation
  ps5: "playstation5_flat",
  "playstation 5": "playstation5_flat",
  ps4: "playstation4_flat",
  "playstation 4": "playstation4_flat",
  ps3: "playstation3_flat",
  "playstation 3": "playstation3_flat",
  ps2: "playstation2_flat",
  "playstation 2": "playstation2_flat",
  ps1: "playstation_flat",
  "playstation 1": "playstation_flat",
  playstation: "playstation_flat",
  "ps-vita": "playstation_vita",
  "ps vita": "playstation_vita",
  "playstation vita": "playstation_vita",
  psp: "playstation_psp",
  "playstation portable": "playstation_psp",
  psvr: "playstation_ps5_compact",
  psvr2: "playstation_ps5_compact",

  // Nintendo
  switch: "nintendo_switch",
  "nintendo switch": "nintendo_switch",
  "wii-u": "nintendo_wiiu",
  "wii u": "nintendo_wiiu",
  "nintendo wii u": "nintendo_wiiu",
  wii: "nintendo_wii",
  "nintendo wii": "nintendo_wii",
  gamecube: "nintendo_gamecube",
  "nintendo gamecube": "nintendo_gamecube",
  n64: "nintendo_64",
  "nintendo 64": "nintendo_64",
  snes: "nintendo_snes",
  "super nintendo": "nintendo_snes",
  "super nintendo (snes)": "nintendo_snes",
  nes: "nintendo_nes",
  "nintendo nes": "nintendo_nes",
  n3ds: "nintendo_3ds",
  "3ds": "nintendo_3ds",
  "nintendo 3ds": "nintendo_3ds",
  nds: "nintendo_ds",
  ds: "nintendo_ds",
  "nintendo ds": "nintendo_ds",
  gba: "nintendo_gameboy_advance",
  "game boy advance": "nintendo_gameboy_advance",
  gbc: "nintendo_gameboy_color",
  "game boy color": "nintendo_gameboy_color",
  gb: "nintendo_gameboy",
  "game boy": "nintendo_gameboy",
  "virtual-boy": "nintendo_virtualboy",
  "virtual boy": "nintendo_virtualboy",
  "game-and-watch": "handheld_game_and_watch",
  "game & watch": "handheld_game_and_watch",

  // Microsoft Xbox
  "xbox-series": "xbox_series",
  "xbox series": "xbox_series",
  "xbox series x|s": "xbox_series",
  "xbox-one": "xbox_one",
  "xbox one": "xbox_one",
  "xbox-360": "xbox_360",
  "xbox 360": "xbox_360",
  "xbox-original": "xbox_original",
  xbox: "xbox",
  "xbox (original)": "xbox_original",

  // Sega
  dreamcast: "sega_dreamcast",
  "sega dreamcast": "sega_dreamcast",
  saturn: "sega_saturn",
  "sega saturn": "sega_saturn",
  "mega-drive": "sega_megadrive",
  "mega drive": "sega_megadrive",
  genesis: "sega_genesis",
  "sega mega drive / genesis": "sega_megadrive",
  "master-system": "sega_master_system",
  "master system": "sega_master_system",
  "sega master system": "sega_master_system",
  "game-gear": "sega_gamegear",
  "game gear": "sega_gamegear",
  "sega game gear": "sega_gamegear",
  "sega-cd": "sega_cd",
  "sega cd": "sega_cd",
  "sega-32x": "sega_32x",
  "sega 32x": "sega_32x",

  // PC & Portable
  pc: "publisher_steam",
  steam: "publisher_steam",
  "steam-deck": "publisher_steam",
  "steam deck": "publisher_steam",
  mac: "publisher_apple_alt",
  "mac / macos": "publisher_apple_alt",
  linux: "linux",
  android: "android_2019",
  ios: "publisher_apple_appstore",

  // Atari & Retro
  "atari-2600": "atari_2600",
  "atari 2600": "atari_2600",
  "atari-5200": "atari_5200",
  "atari 5200": "atari_5200",
  "atari-7800": "atari_7800",
  "atari 7800": "atari_7800",
  "atari-lynx": "atari_lynx",
  lynx: "atari_lynx",
  "atari-jaguar": "atari_jaguar",
  jaguar: "atari_jaguar",
  "atari-st": "atari_st",
  "atari st": "atari_st",
  "commodore-64": "commodore_64",
  "commodore 64": "commodore_64",
  c64: "commodore_64",
  amiga: "commodore_amiga",
  "ms-dos": "ms-dos",
  dos: "ms-dos",
  "zx-spectrum": "sinclair_zxspectrum",
  "zx spectrum": "sinclair_zxspectrum",

  // Arcade & Others
  arcade: "arcade",
  "arcade / recreativa": "arcade",
  "neo-geo": "snk_neogeo",
  "neo geo": "snk_neogeo",
  "neo geo (aes / mvs)": "snk_neogeo",
  "neo-geo-pocket": "snk_neogeo_pocket",
  "neo geo pocket": "snk_neogeo_pocket",
  turbografx: "nec_turbografx16",
  "turbografx-16 / pc engine": "nec_turbografx16",
  wonderswan: "bandai_wonderswan",
  "3do": "3do",
  "3do interactive multiplayer": "3do",
  colecovision: "coleco_vision",
  intellivision: "mattel_intellivision",
  vectrex: "vectrex",
};

// Helper to resolve an SVG raw content string for a given platform name or brand key
function resolveSvgContent(platformName?: string, brandKey?: string): string | null {
  const p = (platformName || "").toLowerCase().trim();
  const b = (brandKey || "").toLowerCase().trim();

  // 1. Direct dictionary match
  const filename = PLATFORM_TO_SVG[p] || PLATFORM_TO_SVG[b];
  if (filename) {
    const key = `../lib/svg/${filename}.svg`;
    if (svgModules[key]) {
      return svgModules[key];
    }
  }

  // 2. Fuzzy match in svgModules keys
  const sanitized = p.replace(/[^a-z0-9]/g, "");
  if (sanitized) {
    for (const key of Object.keys(svgModules)) {
      const base = key.replace("../lib/svg/", "").replace(".svg", "").replace(/[^a-z0-9]/g, "");
      if (base === sanitized || base.includes(sanitized) || sanitized.includes(base)) {
        return svgModules[key];
      }
    }
  }

  // 3. Fallback brand match
  if (b && b !== "generic") {
    for (const key of Object.keys(svgModules)) {
      if (key.includes(b)) {
        return svgModules[key];
      }
    }
  }

  return null;
}

// Clean and adapt raw SVG string to handle fill/stroke currentColor gracefully
function adaptSvgString(rawSvg: string): string {
  if (!rawSvg) return "";

  // Make sure SVG paths use fill="currentColor" or preserve strokes so they respond to dark/light theme
  return rawSvg
    .replace(/fill="(?:#fff|#ffffff|#000|#000000)"/gi, 'fill="currentColor"')
    .replace(/stroke="(?:#fff|#ffffff|#000|#000000)"/gi, 'stroke="currentColor"');
}

export const ConsoleLogo: React.FC<ConsoleLogoProps> = ({
  platformName = "",
  brandKey,
  size = 24,
  className = "",
}) => {
  const dimHeight = typeof size === "number" ? `${size}px` : size;

  const rawSvg = resolveSvgContent(platformName, brandKey);

  if (rawSvg) {
    const adapted = adaptSvgString(rawSvg);
    return (
      <span
        className={`inline-flex items-center shrink-0 [&_svg]:h-full [&_svg]:w-auto [&_svg]:max-w-full [&_path]:fill-current [&_g]:fill-current ${className}`}
        style={{ height: dimHeight, maxWidth: "160px" }}
        dangerouslySetInnerHTML={{ __html: adapted }}
        aria-label={platformName || "Console Logo"}
      />
    );
  }

  // Fallback Minimalist Gamepad SVG if no file match is found
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ height: dimHeight, width: dimHeight }}
      fill="currentColor"
      className={`shrink-0 transition-transform ${className}`}
      aria-label="Gaming Console"
    >
      <path d="M17 4H7C4.24 4 2 6.24 2 9v6c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V9c0-2.76-2.24-5-5-5zm-8 7H8v1H7v-1H6v-1h1V9h1v1h1v1zm7.5 1c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm1.5-2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  );
};

