import React, { useState } from "react";
import * as Icons from "lucide-react";
import { Language } from "../types";
import { getTranslation } from "../translations";

interface VideoGameBarcodeProps {
  barcode?: string;
  platform?: string;
  variant?: "retail-sticker" | "minimal" | "dark-cyber" | "compact-spine";
  size?: "sm" | "md" | "lg";
  showCopyButton?: boolean;
  showScanAnimation?: boolean;
  showRegionBadge?: boolean;
  language?: Language;
  className?: string;
  onCopy?: (code: string) => void;
}

// EAN-13 Parity matrix for digit 0 (determines L or G code for digits 1..6)
const PARITY_PATTERNS = [
  ["L", "L", "L", "L", "L", "L"], // 0
  ["L", "L", "G", "L", "G", "G"], // 1
  ["L", "L", "G", "G", "L", "G"], // 2
  ["L", "L", "G", "G", "G", "L"], // 3
  ["L", "G", "L", "L", "G", "G"], // 4
  ["L", "G", "G", "L", "L", "G"], // 5
  ["L", "G", "G", "G", "L", "L"], // 6
  ["L", "G", "L", "G", "L", "G"], // 7
  ["L", "G", "L", "G", "G", "L"], // 8
  ["L", "G", "G", "L", "G", "L"], // 9
];

// L-code patterns (7 modules per digit)
const L_CODES: Record<number, string> = {
  0: "0001101",
  1: "0011001",
  2: "0010011",
  3: "0111101",
  4: "0100011",
  5: "0110001",
  6: "0101111",
  7: "0111011",
  8: "0110111",
  9: "0001011",
};

// G-code patterns (7 modules per digit - reversed inverted L-code)
const G_CODES: Record<number, string> = {
  0: "0100111",
  1: "0110011",
  2: "0011011",
  3: "0100001",
  4: "0011101",
  5: "0111001",
  6: "0000101",
  7: "0010001",
  8: "0001001",
  9: "0010111",
};

// R-code patterns (7 modules per digit - inverted L-code)
const R_CODES: Record<number, string> = {
  0: "1110010",
  1: "1100110",
  2: "1101100",
  3: "1000010",
  4: "1011100",
  5: "1001110",
  6: "1010000",
  7: "1000100",
  8: "1001000",
  9: "1110100",
};

// Simple Code39 representation for non-numeric alphanumeric game codes (e.g. SLUS-20001)
const CODE39_PATTERNS: Record<string, string> = {
  "0": "101001101101",
  "1": "110100101011",
  "2": "101100101011",
  "3": "110110010101",
  "4": "101001101011",
  "5": "110100110101",
  "6": "101100110101",
  "7": "101001011011",
  "8": "110100101101",
  "9": "101100101101",
  "A": "110101001011",
  "B": "101101001011",
  "C": "110110100101",
  "D": "101011001011",
  "E": "110101100101",
  "F": "101101100101",
  "G": "101010011011",
  "H": "110101001101",
  "I": "101101001101",
  "J": "101011001101",
  "K": "110101010011",
  "L": "101101010011",
  "M": "110110101001",
  "N": "101011010011",
  "O": "110101101001",
  "P": "101101101001",
  "Q": "101010110011",
  "R": "110101011001",
  "S": "101101011001",
  "T": "101011011001",
  "U": "110010101011",
  "V": "100110101011",
  "W": "110011010101",
  "X": "100101101011",
  "Y": "110010110101",
  "Z": "100110110101",
  "-": "100101011011",
  ".": "110010101101",
  " ": "100110101101",
  "*": "100101101101", // Start/Stop
};

/**
 * Calculates valid EAN-13 checksum digit for a 12-digit string
 */
export function calculateEan13Checksum(first12: string): number {
  const digits = first12.padEnd(12, "0").substring(0, 12).split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += i % 2 === 0 ? digits[i] : digits[i] * 3;
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * Generates a realistic EAN-13 video game barcode for a specific platform
 */
export function generateRandomGameBarcode(platform?: string): string {
  let prefix = "0045496"; // Nintendo default

  if (platform) {
    const p = platform.toLowerCase();
    if (p.includes("playstation") || p.includes("ps")) {
      prefix = "0711719"; // Sony PlayStation prefix
    } else if (p.includes("xbox")) {
      prefix = "0885370"; // Microsoft Xbox prefix
    } else if (p.includes("sega") || p.includes("genesis") || p.includes("dreamcast") || p.includes("saturn")) {
      prefix = "0010086"; // Sega prefix
    } else if (p.includes("pc") || p.includes("steam")) {
      prefix = "5010555"; // General EA / PC games prefix
    } else if (p.includes("atari")) {
      prefix = "0074272"; // Atari prefix
    } else if (p.includes("game boy") || p.includes("gba") || p.includes("ds") || p.includes("switch") || p.includes("nes") || p.includes("snes") || p.includes("n64")) {
      prefix = "0045496"; // Nintendo prefix
    }
  }

  // Generate 5 random digits for item ID
  let random5 = "";
  for (let i = 0; i < 5; i++) {
    random5 += Math.floor(Math.random() * 10).toString();
  }

  const first12 = prefix + random5;
  const checksum = calculateEan13Checksum(first12);
  return first12 + checksum.toString();
}

/**
 * Guesses publisher or region badge based on platform or barcode
 */
function getRegionBadge(platform?: string, barcode?: string): string {
  if (barcode && (barcode.includes("PAL") || barcode.startsWith("50"))) return "PAL";
  if (barcode && (barcode.includes("NTSC-J") || barcode.startsWith("49"))) return "NTSC-J";

  if (platform) {
    const p = platform.toLowerCase();
    if (p.includes("famicom") || p.includes("pc-engine") || p.includes("saturn")) return "NTSC-J";
  }

  return "NTSC-U/C";
}

export const VideoGameBarcode: React.FC<VideoGameBarcodeProps> = ({
  barcode,
  platform,
  variant = "retail-sticker",
  size = "md",
  showCopyButton = true,
  showScanAnimation = true,
  showRegionBadge = true,
  language = "es",
  className = "",
  onCopy,
}) => {
  const t = getTranslation(language);
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const cleanBarcode = barcode?.trim() || "";
  const isNumeric = /^[0-9]+$/.test(cleanBarcode);

  // Normalize barcode string
  let displayCode = cleanBarcode || "0045496598518";
  let eanDigits = "0000000000000";

  if (isNumeric) {
    if (displayCode.length === 12) {
      // Convert UPC-A to EAN-13 by adding leading zero
      eanDigits = "0" + displayCode;
    } else if (displayCode.length === 13) {
      eanDigits = displayCode;
    } else {
      // Pad or trim to 13 digits
      eanDigits = displayCode.padEnd(13, "0").substring(0, 13);
    }
  }

  // Generate EAN-13 modules
  const generateEan13Modules = (code13: string) => {
    const modules: Array<{ bit: boolean; isGuard: boolean }> = [];

    // Left Guard (101)
    modules.push(
      { bit: true, isGuard: true },
      { bit: false, isGuard: true },
      { bit: true, isGuard: true }
    );

    const firstDigit = parseInt(code13[0] || "0", 10);
    const parityPattern = PARITY_PATTERNS[firstDigit % 10];

    // Left 6 digits (indices 1..6)
    for (let i = 1; i <= 6; i++) {
      const digit = parseInt(code13[i] || "0", 10);
      const encType = parityPattern[i - 1];
      const bits = encType === "L" ? L_CODES[digit] : G_CODES[digit];
      for (const b of bits) {
        modules.push({ bit: b === "1", isGuard: false });
      }
    }

    // Center Guard (01010)
    modules.push(
      { bit: false, isGuard: true },
      { bit: true, isGuard: true },
      { bit: false, isGuard: true },
      { bit: true, isGuard: true },
      { bit: false, isGuard: true }
    );

    // Right 6 digits (indices 7..12)
    for (let i = 7; i <= 12; i++) {
      const digit = parseInt(code13[i] || "0", 10);
      const bits = R_CODES[digit];
      for (const b of bits) {
        modules.push({ bit: b === "1", isGuard: false });
      }
    }

    // Right Guard (101)
    modules.push(
      { bit: true, isGuard: true },
      { bit: false, isGuard: true },
      { bit: true, isGuard: true }
    );

    return modules;
  };

  // Generate Code39 modules for non-numeric barcodes
  const generateCode39Modules = (str: string) => {
    const upper = ("*" + str.toUpperCase().replace(/[^A-Z0-9\-\.\s]/g, "") + "*").substring(0, 14);
    const modules: Array<{ bit: boolean; isGuard: boolean }> = [];

    for (let i = 0; i < upper.length; i++) {
      const char = upper[i];
      const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS[" "];
      for (let j = 0; j < pattern.length; j++) {
        const isGuardChar = i === 0 || i === upper.length - 1;
        modules.push({ bit: pattern[j] === "1", isGuard: isGuardChar });
      }
      modules.push({ bit: false, isGuard: false }); // Gap
    }
    return modules;
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayCode) {
      navigator.clipboard.writeText(displayCode);
      setCopied(true);
      if (onCopy) onCopy(displayCode);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const regionBadge = getRegionBadge(platform, cleanBarcode);

  // Size configurations
  const sizeClasses = {
    sm: "w-full max-w-[130px] p-1.5",
    md: "w-full max-w-[185px] p-2 sm:p-2.5",
    lg: "w-full max-w-[230px] p-2.5 sm:p-3",
  };

  // EAN-13 rendering logic
  const renderEan13SVG = () => {
    const modules = generateEan13Modules(eanDigits);
    const totalModules = modules.length; // 95
    const moduleWidth = 1.0;
    const dataHeight = 18;
    const guardHeight = 22;

    return (
      <div className="relative w-full flex flex-col items-center">
        <svg
          viewBox="-12 0 118 32"
          className="w-full h-auto overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Barcode Bars */}
          <g fill="currentColor">
            {modules.map((m, idx) => {
              if (!m.bit) return null;
              const h = m.isGuard ? guardHeight : dataHeight;
              return (
                <rect
                  key={idx}
                  x={idx * moduleWidth}
                  y="0"
                  width="0.88"
                  height={h}
                  rx="0.1"
                />
              );
            })}
          </g>

          {/* EAN-13 Digits sitting cleanly below barcode */}
          <g fill="currentColor" className="font-mono font-bold select-none" fontSize="8" textAnchor="middle">
            {/* First digit (outside left guard) */}
            <text x="-6" y="29">
              {eanDigits[0]}
            </text>

            {/* Left 6 digits */}
            <text x="24" y="29" letterSpacing="0.5">
              {eanDigits.substring(1, 7)}
            </text>

            {/* Right 6 digits */}
            <text x="71" y="29" letterSpacing="0.5">
              {eanDigits.substring(7, 13)}
            </text>

            {/* End symbol '>' */}
            <text x="98" y="29" textAnchor="start" fontSize="6">
              &gt;
            </text>
          </g>
        </svg>
      </div>
    );
  };

  // Code39 rendering logic for custom alphanumeric serials
  const renderCode39SVG = () => {
    const modules = generateCode39Modules(displayCode);
    const totalModules = modules.length;
    const svgWidth = totalModules * 1.1;

    return (
      <div className="relative w-full flex flex-col items-center">
        <svg
          viewBox={`-2 0 ${svgWidth + 4} 28`}
          className="w-full h-auto overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          <g fill="currentColor">
            {modules.map((m, idx) => {
              if (!m.bit) return null;
              return (
                <rect
                  key={idx}
                  x={idx * 1.1}
                  y="0"
                  width="0.9"
                  height={m.isGuard ? "20" : "16"}
                />
              );
            })}
          </g>
          <text
            x={svgWidth / 2}
            y="26"
            fill="currentColor"
            textAnchor="middle"
            className="font-mono font-bold text-[7px] tracking-[1.5px]"
          >
            {displayCode.toUpperCase()}
          </text>
        </svg>
      </div>
    );
  };

  // Style Variants
  const isDarkCyber = variant === "dark-cyber";
  const isMinimal = variant === "minimal";
  const isSpine = variant === "compact-spine";

  const containerBaseClass = `group relative select-none cursor-pointer transition-all duration-300 rounded-none ${sizeClasses[size]} ${className}`;

  let variantStyle = "bg-white text-black border border-neutral-300 shadow-sm hover:shadow-md hover:border-neutral-400";

  if (isDarkCyber) {
    variantStyle = "bg-[#0d0d11] text-neutral-100 border border-indigo-500/30 shadow-lg hover:border-indigo-500/60";
  } else if (isMinimal) {
    variantStyle = "bg-transparent text-current border-none shadow-none";
  } else if (isSpine) {
    variantStyle = "bg-neutral-900 text-amber-400 border border-amber-500/20 shadow-sm";
  }

  return (
    <div
      onClick={handleCopy}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${containerBaseClass} ${variantStyle}`}
      title={showCopyButton ? "Hacer clic para copiar el código de barras" : undefined}
    >
      {/* Main Barcode Vector Graphic */}
      <div className="relative w-full py-0.5">
        {isNumeric ? renderEan13SVG() : renderCode39SVG()}
      </div>

      {/* Bottom Footer: Copy Status / Format Tag */}
      {showCopyButton && (
        <div className="mt-0.5 flex items-center justify-between text-[7.5px] font-mono opacity-80 pt-0.5 border-t border-black/5 dark:border-white/5">
          <span className="text-neutral-500 dark:text-neutral-400 truncate">
            {isNumeric ? "EAN-13" : "SERIAL"}
          </span>
          <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
            {copied ? (
              <>
                <Icons.Check className="w-2.5 h-2.5 stroke-[3] text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{t.copiedBarcode || "COPIADO"}</span>
              </>
            ) : (
              <>
                <Icons.Copy className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">{t.copyBarcode || "COPIAR"}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
