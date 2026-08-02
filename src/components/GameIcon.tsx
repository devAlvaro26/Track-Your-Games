import React from "react";
import * as Icons from "lucide-react";
import { translateSymbolLabel } from "../translations";
import { Language } from "../types";

interface GameIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const GameIcon: React.FC<GameIconProps> = ({ name, className = "", size = 24 }) => {
  // Normalize the name to match standard Lucide component names (CamelCase)
  const normalizedName = name.trim().toLowerCase();

  // Custom dictionary mapping simple strings to Lucide components
  const iconMap: Record<string, keyof typeof Icons> = {
    sword: "Sword",
    shield: "Shield",
    gamepad: "Gamepad2",
    gamepad2: "Gamepad2",
    crown: "Crown",
    ghost: "Ghost",
    trophy: "Trophy",
    compass: "Compass",
    flame: "Flame",
    music: "Music",
    skull: "Skull",
    heart: "Heart",
    star: "Star",
    rocket: "Rocket",
    target: "Target",
    wrench: "Wrench",
    car: "Car",
    bolt: "Bolt",
    sparkles: "Sparkles",
    book: "BookOpen",
    calendar: "Calendar",
    barcode: "Barcode",
    user: "User",
    clock: "Clock",
  };

  const lucideKey = iconMap[normalizedName] || "Gamepad2";
  const LucideIcon = Icons[lucideKey] as React.ComponentType<any>;

  if (!LucideIcon) {
    return <Icons.Gamepad2 className={className} size={size} id="default-game-icon" />;
  }

  return <LucideIcon className={className} size={size} id={`game-icon-${normalizedName}`} />;
};

// Available icon symbol metadata for cover selection
export const AVAILABLE_SYMBOLS = [
  { id: "gamepad", icon: "gamepad" },
  { id: "sword", icon: "sword" },
  { id: "shield", icon: "shield" },
  { id: "crown", icon: "crown" },
  { id: "skull", icon: "skull" },
  { id: "star", icon: "star" },
  { id: "car", icon: "car" },
  { id: "bolt", icon: "bolt" },
  { id: "ghost", icon: "ghost" },
  { id: "compass", icon: "compass" },
  { id: "flame", icon: "flame" },
  { id: "trophy", icon: "trophy" },
  { id: "sparkles", icon: "sparkles" },
  { id: "target", icon: "target" },
  { id: "rocket", icon: "rocket" },
];

/**
 * Helper to get localized label for a symbol id from central translations
 */
export function getSymbolLabel(symbolId: string, lang: Language = "es"): string {
  return translateSymbolLabel(symbolId, lang);
}
