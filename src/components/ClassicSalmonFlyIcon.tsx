import React from 'react';

interface ClassicSalmonFlyIconProps {
  className?: string;
}

/**
 * Single-color vector illustration of a classic traditional Spey/Salmon featherwing fly.
 * Uses currentColor to adapt automatically to both Light (Journal/Day) and Dark (Night) themes.
 */
export const ClassicSalmonFlyIcon: React.FC<ClassicSalmonFlyIconProps> = ({ className = 'w-8 h-8' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Hook Eye & Shank */}
      <circle cx="16" cy="46" r="3.2" strokeWidth="2.4" fill="none" />
      <path
        d="M19 46 H76 C84 46 90 53 90 62 C90 73 80 82 66 82 C55 82 48 74 48 66"
        strokeWidth="2.8"
        fill="none"
      />
      {/* Barb & Point */}
      <path d="M48 66 L44 59 L52 64" strokeWidth="2.2" fill="currentColor" />

      {/* Fly Body Segments & Ribbing (Tinsel) */}
      <path d="M30 46 L35 40" strokeWidth="1.8" />
      <path d="M40 46 L45 40" strokeWidth="1.8" />
      <path d="M50 46 L55 40" strokeWidth="1.8" />
      <path d="M60 46 L65 41" strokeWidth="1.8" />
      <path d="M70 46 L74 42" strokeWidth="1.8" />

      {/* Tag / Butt at hook bend */}
      <ellipse cx="74" cy="47" rx="3.5" ry="2.2" strokeWidth="1.8" fill="currentColor" fillOpacity="0.25" />

      {/* Golden Pheasant Crest Tail Sweeping Downward */}
      <path
        d="M74 46 C83 45 88 50 89 57 C89 60 87 63 84 64"
        strokeWidth="2.2"
        fill="none"
      />
      <path
        d="M74 46 C80 47 85 52 85 58"
        strokeWidth="1.4"
        strokeDasharray="1.5 1.5"
        fill="none"
      />

      {/* Throat Hackle / Fibers below shank */}
      <path d="M26 47 C24 53 23 58 26 63" strokeWidth="1.8" />
      <path d="M29 47 C28 54 29 59 33 64" strokeWidth="1.8" />
      <path d="M33 47 C34 54 37 60 42 64" strokeWidth="1.8" />
      <path d="M37 47 C40 54 45 59 50 62" strokeWidth="1.6" />
      <path d="M42 47 C46 53 51 57 56 60" strokeWidth="1.6" />
      <path d="M48 47 C52 52 57 56 63 58" strokeWidth="1.5" />

      {/* Main Featherwing Profile (Married / Spey Wing) */}
      <path
        d="M23 44 C34 26 56 16 83 22 C72 28 62 36 54 44 Z"
        strokeWidth="2.4"
        fill="currentColor"
        fillOpacity="0.18"
      />
      {/* Feather Quill & Barb Radiations */}
      <path d="M23 44 C44 26 64 21 82 22" strokeWidth="1.8" />
      <path d="M36 36 C48 30 62 27 75 27" strokeWidth="1.2" />
      <path d="M45 40 C56 35 68 33 78 34" strokeWidth="1.2" />

      {/* Topping Feather (Curved crest over top of wing) */}
      <path
        d="M23 43 C36 18 62 10 88 18"
        strokeWidth="2"
        fill="none"
      />
      {/* Horns / Antennae (Amherst pheasant tail strips) */}
      <path
        d="M22 42 C42 20 68 18 86 28"
        strokeWidth="1.5"
        strokeDasharray="3 1.5"
        fill="none"
      />

      {/* Thread Head & Varnish */}
      <path
        d="M19 43 C20 41 24 41 25 44 C26 47 21 49 19 46 Z"
        strokeWidth="2.2"
        fill="currentColor"
      />
    </svg>
  );
};
