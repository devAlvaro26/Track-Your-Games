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

  const logoSize = size === "sm" ? 22 : size === "lg" ? 34 : 26;

  const sizePadding =
    size === "sm"
      ? "px-3 py-1.5"
      : size === "lg"
      ? "px-4 py-2.5"
      : "px-3.5 py-2";

  return (
    <div
      className={`w-full flex items-center justify-start ${brand.bannerBg} ${brand.bannerTextColor} ${sizePadding} border-b border-white/10 shadow-sm select-none ${className}`}
      title={platformName || brand.displayName}
    >
      {/* BANNER SUPERIOR: UNICAMENTE EL LOGO DE LA CONSOLA */}
      <div className="flex items-center shrink-0 min-h-[22px]" id={`banner-logo-${platformName || "default"}`}>
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



