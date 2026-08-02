import React from "react";
import { getConsoleBrandStyle } from "../lib/consoleBranding";
import { ConsoleLogo } from "./ConsoleLogo";

interface ConsoleBannerProps {
  platformName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ConsoleBanner: React.FC<ConsoleBannerProps> = ({
  platformName,
  size = "md",
  className = "",
}) => {
  const brand = getConsoleBrandStyle(platformName);

  const logoSize = size === "sm" ? 18 : size === "lg" ? 32 : 24;

  const sizePadding =
    size === "sm"
      ? "px-2 py-1 sm:px-3 sm:py-1.5"
      : size === "lg"
      ? "px-3.5 py-2 sm:px-4 sm:py-2.5"
      : "px-2.5 py-1.5 sm:px-3.5 sm:py-2";

  return (
    <div
      className={`w-full flex items-center justify-center sm:justify-start ${brand.bannerBg} ${brand.bannerTextColor} ${sizePadding} border-b border-white/10 shadow-sm select-none overflow-hidden shrink-0 ${className}`}
      title={platformName || brand.displayName}
    >
      {/* BANNER SUPERIOR: UNICAMENTE EL LOGO DE LA CONSOLA */}
      <div className="flex items-center justify-center sm:justify-start w-full max-w-full overflow-hidden" id={`banner-logo-${platformName || "default"}`}>
        <ConsoleLogo
          platformName={platformName}
          brandKey={brand.brandKey}
          size={logoSize}
          className="drop-shadow-sm transition-transform group-hover:scale-105"
        />
      </div>
    </div>
  );
};



