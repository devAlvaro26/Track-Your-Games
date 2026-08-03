import React from "react";
import * as Icons from "lucide-react";
import { Language } from "../types";
import { getTranslation } from "../translations";

interface ProfileAvatarProps {
  avatarUrl?: string;
  username?: string;
  size?: "sm" | "md" | "lg";
  language?: Language;
  onClick?: () => void;
  className?: string;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  avatarUrl,
  username = "",
  size = "md",
  language = "es",
  onClick,
  className = "",
}) => {
  const t = getTranslation(language);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-20 h-20 text-2xl",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-9 h-9",
  };

  const containerClass = `relative shrink-0 overflow-hidden ${sizeClasses[size]} ${onClick ? "cursor-pointer hover:opacity-90 active:scale-95 transition-all" : ""
    } ${className}`;

  const titleText = username
    ? (t.profileOf || "Perfil de {name}").replace("{name}", username)
    : t.profile || "Perfil";

  if (avatarUrl) {
    return (
      <div
        className={`${containerClass} bg-indigo-600 border-2 border-indigo-500/60 shadow-md flex items-center justify-center`}
        onClick={onClick}
        title={titleText}
        id="profile-avatar-img-container"
      >
        <img
          src={avatarUrl}
          alt={username || "Avatar"}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${containerClass} bg-indigo-600 text-white shadow-md flex items-center justify-center font-black`}
      onClick={onClick}
      title={titleText}
      id="profile-avatar-default-container"
    >
      <Icons.Library className={iconSizes[size]} />
    </div>
  );
};
