import React from "react";
import { getConsoleBrandStyle } from "../lib/consoleBranding";
import { ConsoleLogo } from "./ConsoleLogo";

interface ConsoleBannerProps {
  platformName?: string;
  platforms?: string[];
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ConsoleBanner: React.FC<ConsoleBannerProps> = ({
  platformName,
  platforms,
  size = "md",
  className = "",
}) => {
  const platformList = Array.from(
    new Set((platforms?.length ? platforms : [platformName]).filter((name): name is string => Boolean(name?.trim())))
  );
  const brand = getConsoleBrandStyle(platformList[0]);
  const brandColors: Record<string, string> = {
    xbox: "#107C41",
    playstation: "#00439C",
    nintendo: "#E60012",
    pc: "#1b2838",
    sega: "#004B99",
    retro: "#92400E",
    generic: "#171717",
  };
  const bannerGradient = platformList.length > 1
    ? `linear-gradient(90deg, ${platformList.flatMap((name, index) => {
        const color = brandColors[getConsoleBrandStyle(name).brandKey];
        if (index === 0) return [`${color} 0%`];
        const boundary = (index / platformList.length) * 100;
        const transition = Math.min(4, 50 / (platformList.length - 1));
        return [`${brandColors[getConsoleBrandStyle(platformList[index - 1]).brandKey]} ${boundary - transition / 2}%`, `${color} ${boundary + transition / 2}%`];
      }).join(", ")}, ${brandColors[getConsoleBrandStyle(platformList[platformList.length - 1]).brandKey]} 100%)`
    : undefined;

  const logoSize = size === "sm" ? 18 : size === "lg" ? 32 : 24;
  const multiLogoSize = size === "sm" ? 15 : size === "lg" ? 24 : 19;

  const sizePadding =
    size === "sm"
      ? "px-2 py-1 sm:px-3 sm:py-1.5"
      : size === "lg"
        ? "px-3.5 py-2 sm:px-4 sm:py-2.5"
        : "px-2.5 py-1.5 sm:px-3.5 sm:py-2";

  return (
    <div
      className={`relative box-border w-full min-w-full flex-none self-stretch flex items-center justify-center sm:justify-start ${platformList.length === 1 ? brand.bannerBg : ""} ${brand.bannerTextColor} ${sizePadding} border-b border-white/10 shadow-sm select-none overflow-hidden ${className}`}
      title={platformList.length > 0 ? platformList.join(", ") : brand.displayName}
      style={bannerGradient ? { backgroundImage: bannerGradient } : undefined}
    >
      {platformList.length > 1 ? (
        <>
          <div aria-hidden="true" className="w-0 shrink-0" style={{ height: logoSize }} />
          <div
            className="absolute inset-0 grid w-full"
            style={{ gridTemplateColumns: `repeat(${platformList.length}, minmax(0, 1fr))` }}
            role="group"
            aria-label={`Platforms: ${platformList.join(", ")}`}
            id="banner-logos-multiple"
          >
            {platformList.map((name) => {
              const platformBrand = getConsoleBrandStyle(name);
              return (
                <div
                  key={name}
                  className={`flex min-w-0 items-center justify-center overflow-hidden border border-white/15 ${platformBrand.bannerTextColor}`}
                  title={platformBrand.displayName}
                >
                  <ConsoleLogo
                    platformName={name}
                    brandKey={platformBrand.brandKey}
                    size={multiLogoSize}
                    className="drop-shadow-sm"
                  />
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center sm:justify-start w-full max-w-full overflow-hidden" id={`banner-logo-${platformList[0] || "default"}`}>
          <ConsoleLogo
            platformName={platformList[0]}
            brandKey={brand.brandKey}
            size={logoSize}
            className="drop-shadow-sm transition-transform group-hover:scale-105"
          />
        </div>
      )}
    </div>
  );
};
