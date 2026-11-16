import type { SVGProps } from 'react';

export function TitleEmblemSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 540 175"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Frostwood Tycoon"
      {...props}
    >
      {/* Timber & Iron Crest Emblem */}
      <g transform="translate(8, 12)">
        {/* Pine silhouette crest */}
        <path
          d="M42 4 L64 36 H51 L70 64 H54 L74 92 H10 L30 64 H14 L33 36 H20 L42 4 Z"
          fill="#264e3e"
          stroke="#132232"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Snow caps on crest */}
        <path
          d="M42 6 L53 23 C46 21 38 21 31 23 L42 6 Z"
          fill="#f4f8fc"
        />
        {/* Crossed axe & golden coin accent */}
        <path
          d="M19 88 L66 44 M65 44 L73 52 L60 61 L55 51 Z"
          stroke="#e4b457"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#d9e5f0"
        />
        <circle cx="42" cy="84" r="11" fill="#f6c344" stroke="#132232" strokeWidth="3.5" />
        <path d="M42 78 V90 M37 84 H47" stroke="#6b4410" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Carved Wood & Frost Typography */}
      <g transform="translate(102, 22)">
        <text
          x="0"
          y="58"
          fill="#f4efe6"
          stroke="#132232"
          strokeWidth="8"
          paintOrder="stroke fill"
          fontFamily="Cinzel, Georgia, serif"
          fontWeight="800"
          fontSize="50"
          letterSpacing="2"
        >
          FROSTWOOD
        </text>
        <text
          x="2"
          y="102"
          fill="#f6c344"
          stroke="#132232"
          strokeWidth="7"
          paintOrder="stroke fill"
          fontFamily="Cinzel, Georgia, serif"
          fontWeight="700"
          fontSize="32"
          letterSpacing="6"
        >
          TYCOON
        </text>
        <path
          d="M2 118 H320"
          stroke="#f6c344"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M150 112 L160 118 L150 124 L140 118 Z"
          fill="#9ed8f5"
          stroke="#132232"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}

export function WoodIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="10" width="14" height="7" rx="3.5" fill="#7e5233" stroke="#162336" strokeWidth="2" />
      <rect x="7" y="5" width="14" height="7" rx="3.5" fill="#9a643f" stroke="#162336" strokeWidth="2" />
      <circle cx="17.5" cy="8.5" r="2.2" fill="#e8c89b" stroke="#53321c" strokeWidth="1" />
      <circle cx="13.5" cy="13.5" r="2.2" fill="#e8c89b" stroke="#53321c" strokeWidth="1" />
    </svg>
  );
}

export function StoneIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 17 L7 8.5 L12.5 5 L19 9 L19.5 17 L13 19.5 L5 17 Z"
        fill="#8d99a6"
        stroke="#162336"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12.5 5 L13 12.5 L19 9 M13 12.5 L5 17 M13 12.5 L13 19.5" stroke="#53606e" strokeWidth="1.4" />
      <path d="M8.5 9.2 L11.8 7" stroke="#cfd9e3" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IceIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3 L17.5 9.5 L15.5 20 L8.5 20 L6.5 9.5 L12 3 Z"
        fill="#7be0ff"
        stroke="#162336"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 3 L12 20 M6.5 9.5 L17.5 9.5" stroke="#e4f8ff" strokeWidth="1.4" />
      <path d="M9 14.5 L12 20 L15 14.5" stroke="#2c7ea8" strokeWidth="1.4" />
    </svg>
  );
}

export function PeltIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 5 C9 3.5 15 3.5 18 5 L20 10 L17.5 19 C14.5 20.5 9.5 20.5 6.5 19 L4 10 L6 5 Z"
        fill="#a36c46"
        stroke="#162336"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M8 7.5 C10.5 6.5 13.5 6.5 16 7.5" stroke="#efe9dd" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M9 12 H15" stroke="#5c361d" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function MeatIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {/* Bone shank */}
      <path
        d="M4.5 17.5 L9.5 12.5"
        stroke="#f4efe6"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="4.2" cy="16.2" r="1.9" fill="#f4efe6" stroke="#162336" strokeWidth="1.4" />
      <circle cx="5.8" cy="18.2" r="1.9" fill="#f4efe6" stroke="#162336" strokeWidth="1.4" />
      {/* Roasted haunch cut */}
      <path
        d="M8.5 11.2 C8.2 6.8 12.2 3.8 16.5 4.6 C20.2 5.3 21.4 9.5 19.2 13.2 C17.1 16.6 12.5 17.4 9.6 14.8 C8.7 14.0 8.6 12.5 8.5 11.2 Z"
        fill="#c94a38"
        stroke="#162336"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Marbling & sear glaze */}
      <ellipse cx="14.6" cy="9.6" rx="3.4" ry="2.3" transform="rotate(-20 14.6 9.6)" fill="#e87a64" />
      <circle cx="15.2" cy="9.4" r="1.1" fill="#f7ede2" />
    </svg>
  );
}

export function GoldIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="#f6c344" stroke="#162336" strokeWidth="2" />
      <circle cx="12" cy="12" r="5.5" stroke="#9e6d12" strokeWidth="1.4" />
      <path d="M12 8.5 V15.5 M9.5 11 H14.5" stroke="#7d5207" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function GearIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M10.5 2.5 H13.5 L14.1 4.7 C14.8 4.9 15.4 5.2 16 5.6 L18 4.4 L20.1 6.5 L18.9 8.5 C19.3 9.1 19.6 9.7 19.8 10.4 L22 11 V14 L19.8 14.6 C19.6 15.3 19.3 15.9 18.9 16.5 L20.1 18.5 L18 20.6 L16 19.4 C15.4 19.8 14.8 20.1 14.1 20.3 L13.5 22.5 H10.5 L9.9 20.3 C9.2 20.1 8.6 19.8 8 19.4 L6 20.6 L3.9 18.5 L5.1 16.5 C4.7 15.9 4.4 15.3 4.2 14.6 L2 14 V11 L4.2 10.4 C4.4 9.7 4.7 9.1 5.1 8.5 L3.9 6.5 L6 4.4 L8 5.6 C8.6 5.2 9.2 4.9 9.9 4.7 L10.5 2.5 Z"
        fill="#d6a047"
        stroke="#162336"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3.4" fill="#162336" stroke="#f6d37a" strokeWidth="1.4" />
    </svg>
  );
}

export function AxeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 19 L16 8" stroke="#9a643f" strokeWidth="3.2" strokeLinecap="round" />
      <path
        d="M13 5 L19 3.5 C20.5 7 19.5 10.5 16.5 12.5 L12.5 8.5 Z"
        fill="#c8d6e5"
        stroke="#162336"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BowIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 19 C4 13 6 7 15 4"
        stroke="#c58b4e"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path d="M6 19 L15 4" stroke="#eef4fa" strokeWidth="1.2" />
      <path d="M8 16 L19 5 M19 5 H15 M19 5 V9" stroke="#f6c344" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WarmthIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3 C14.5 7 18 9.5 18 14 A6 6 0 1 1 6 14 C6 10.5 8.5 8.5 9.5 6.5 C10 8.2 11 8.8 11.5 9.2 C11.2 6.8 11.5 5 12 3 Z"
        fill="#ff8f3a"
        stroke="#162336"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 12 C13.5 13.8 14.5 15 14.5 16.5 A2.5 2.5 0 1 1 9.5 16.5 C9.5 15 10.5 13.8 12 12 Z" fill="#ffe17d" />
    </svg>
  );
}

export function HeartIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 20.5 L4.5 13.2 A4.8 4.8 0 0 1 11.5 6.6 L12 7.2 L12.5 6.6 A4.8 4.8 0 0 1 19.5 13.2 L12 20.5 Z"
        fill="#e5534b"
        stroke="#162336"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WeatherIcon({
  weather,
  className = 'w-4 h-4',
}: {
  weather: 'clear' | 'light_snow' | 'blizzard';
  className?: string;
}) {
  if (weather === 'clear') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="5" fill="#f6c344" stroke="#162336" strokeWidth="1.8" />
        <path
          d="M12 3 V5.5 M12 18.5 V21 M3 12 H5.5 M18.5 12 H21 M5.6 5.6 L7.4 7.4 M16.6 16.6 L18.4 18.4 M18.4 5.6 L16.6 7.4 M7.4 16.6 L5.6 18.4"
          stroke="#f6c344"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (weather === 'light_snow') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
        <path
          d="M12 3 V21 M4.2 7.5 L19.8 16.5 M19.8 7.5 L4.2 16.5"
          stroke="#bde2ff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="2.2" fill="#f4f8fc" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 8 H16 C18 8 19 6.5 18 5 C17 3.8 15 4.2 14.5 5.5 M4 13 H19 C21 13 21.5 15 20 16 C18.8 17 17.5 16 17.2 15 M3 18 H13"
        stroke="#8fd6ff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="7" cy="5.5" r="1.3" fill="#f4f8fc" />
      <circle cx="18" cy="19.5" r="1.3" fill="#f4f8fc" />
    </svg>
  );
}
