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
      className={`w-full flex items-center justify-center sm:justify-start ${brand.bannerBg} ${brand.bannerTextColor} ${sizePadding} border-b border-white/10 shadow-sm select-none overflow-hidden shrink-0 ${className}`}
      title={platformList.length > 0 ? platformList.join(", ") : brand.displayName}
    >
      {platformList.length > 1 ? (
        <div
          className="grid w-full max-w-full gap-1"
          style={{ gridTemplateColumns: `repeat(${platformList.length <= 3 ? platformList.length : 2}, minmax(0, 1fr))` }}
          role="group"
          aria-label={`Platforms: ${platformList.join(", ")}`}
          id="banner-logos-multiple"
        >
          {platformList.map((name) => {
            const platformBrand = getConsoleBrandStyle(name);
            return (
              <div
                key={name}
                className={`flex min-w-0 items-center justify-center overflow-hidden border border-white/15 ${platformBrand.bannerBg} ${platformBrand.bannerTextColor}`}
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
