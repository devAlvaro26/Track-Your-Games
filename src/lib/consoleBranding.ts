export interface ConsoleBrandStyle {
  brandKey: "xbox" | "playstation" | "nintendo" | "pc" | "sega" | "retro" | "generic";
  displayName: string;
  bannerBg: string;
  bannerTextColor: string;
  accentBorder: string;
  badgeBg: string;
}

export function getConsoleBrandStyle(platformName?: string): ConsoleBrandStyle {
  if (!platformName) {
    return {
      brandKey: "generic",
      displayName: "GAME",
      bannerBg: "bg-slate-800",
      bannerTextColor: "text-slate-200",
      accentBorder: "border-slate-700",
      badgeBg: "bg-slate-900/80",
    };
  }

  const p = platformName.toLowerCase().trim();

  // 1. XBOX
  if (p.includes("xbox")) {
    let name = "XBOX";
    if (p.includes("series")) name = "XBOX SERIES";
    else if (p.includes("one")) name = "XBOX ONE";
    else if (p.includes("360")) name = "XBOX 360";

    return {
      brandKey: "xbox",
      displayName: name,
      bannerBg: "bg-gradient-to-r from-[#107C41] via-[#0F783C] to-[#0A4D26]",
      bannerTextColor: "text-white font-black",
      accentBorder: "border-[#107C41]/50",
      badgeBg: "bg-black/40",
    };
  }

  // 2. PLAYSTATION
  if (
    p.includes("playstation") ||
    p.includes("ps5") ||
    p.includes("ps4") ||
    p.includes("ps3") ||
    p.includes("ps2") ||
    p.includes("ps1") ||
    p.includes("psone") ||
    p.includes("psx") ||
    p.includes("vita") ||
    p.includes("psp") ||
    p.includes("psvr")
  ) {
    let name = "PLAYSTATION";
    if (p.includes("ps5") || p.includes("playstation 5")) name = "PS5";
    else if (p.includes("ps4") || p.includes("playstation 4")) name = "PS4";
    else if (p.includes("ps3") || p.includes("playstation 3")) name = "PS3";
    else if (p.includes("ps2") || p.includes("playstation 2")) name = "PS2";
    else if (
      p.includes("ps1") ||
      p.includes("playstation 1") ||
      p.includes("psone") ||
      p.includes("psx") ||
      p === "playstation"
    )
      name = "PS1";
    else if (p.includes("vita")) name = "PS VITA";
    else if (p.includes("psp")) name = "PSP";

    const isBlackBanner = name === "PS1" || name === "PS2";

    return {
      brandKey: "playstation",
      displayName: name,
      bannerBg: isBlackBanner
        ? "bg-black"
        : "bg-gradient-to-r from-[#00439C] via-[#0052C2] to-[#002C68]",
      bannerTextColor: "text-white font-black",
      accentBorder: "border-[#00439C]/50",
      badgeBg: "bg-black/40",
    };
  }

  // 3. NINTENDO
  if (
    p.includes("nintendo") ||
    p.includes("switch") ||
    p.includes("wii") ||
    p.includes("gamecube") ||
    p.includes("n64") ||
    p.includes("snes") ||
    p.includes("nes") ||
    p.includes("3ds") ||
    p.includes("ds") ||
    p.includes("gba") ||
    p.includes("gbc") ||
    p.includes("game boy")
  ) {
    let name = "NINTENDO";
    if (p.includes("switch")) name = "NINTENDO SWITCH";
    else if (p.includes("wii u")) name = "WII U";
    else if (p.includes("wii")) name = "WII";
    else if (p.includes("gamecube")) name = "GAMECUBE";
    else if (p.includes("n64")) name = "NINTENDO 64";
    else if (p.includes("snes")) name = "SNES";
    else if (p.includes("nes")) name = "NES";
    else if (p.includes("3ds")) name = "NINTENDO 3DS";
    else if (p.includes("gba") || p.includes("game boy advance")) name = "GBA";

    return {
      brandKey: "nintendo",
      displayName: name,
      bannerBg: "bg-gradient-to-r from-[#E60012] via-[#C4000F] to-[#80000A]",
      bannerTextColor: "text-white font-black",
      accentBorder: "border-[#E60012]/50",
      badgeBg: "bg-black/40",
    };
  }

  // 4. PC & STEAM
  if (
    p.includes("pc") ||
    p.includes("steam") ||
    p.includes("deck") ||
    p.includes("mac") ||
    p.includes("linux")
  ) {
    let name = "PC / STEAM";
    if (p.includes("deck")) name = "STEAM DECK";
    else if (p.includes("mac")) name = "MAC";
    else if (p.includes("linux")) name = "LINUX";

    return {
      brandKey: "pc",
      displayName: name,
      bannerBg: "bg-gradient-to-r from-[#171a21] via-[#1b2838] to-[#2a475e]",
      bannerTextColor: "text-cyan-300 font-black",
      accentBorder: "border-cyan-500/30",
      badgeBg: "bg-black/50",
    };
  }

  // 5. SEGA
  if (
    p.includes("sega") ||
    p.includes("dreamcast") ||
    p.includes("saturn") ||
    p.includes("mega drive") ||
    p.includes("genesis") ||
    p.includes("master system") ||
    p.includes("game gear")
  ) {
    let name = "SEGA";
    if (p.includes("dreamcast")) name = "DREAMCAST";
    else if (p.includes("saturn")) name = "SATURN";
    else if (p.includes("mega drive") || p.includes("genesis")) name = "MEGA DRIVE";

    return {
      brandKey: "sega",
      displayName: name,
      bannerBg: "bg-gradient-to-r from-[#004B99] via-[#0060A8] to-[#002B59]",
      bannerTextColor: "text-white font-black",
      accentBorder: "border-[#0060A8]/50",
      badgeBg: "bg-black/40",
    };
  }

  // 6. RETRO & ATARI & ARCADE
  if (
    p.includes("atari") ||
    p.includes("arcade") ||
    p.includes("commodore") ||
    p.includes("amiga") ||
    p.includes("dos") ||
    p.includes("neo geo") ||
    p.includes("spectrum")
  ) {
    return {
      brandKey: "retro",
      displayName: platformName.toUpperCase(),
      bannerBg: "bg-gradient-to-r from-[#78350F] via-[#92400E] to-[#451A03]",
      bannerTextColor: "text-amber-200 font-black",
      accentBorder: "border-amber-600/40",
      badgeBg: "bg-black/50",
    };
  }

  // Fallback
  return {
    brandKey: "generic",
    displayName: platformName.toUpperCase(),
    bannerBg: "bg-gradient-to-r from-neutral-800 via-neutral-900 to-black",
    bannerTextColor: "text-neutral-200 font-black",
    accentBorder: "border-white/10",
    badgeBg: "bg-black/50",
  };
}
