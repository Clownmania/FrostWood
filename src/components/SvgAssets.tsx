import type { SVGProps } from 'react';

export function SpriteIcon({ col, row, size = 24, className = '', title }: { col: number; row: number; size?: number; className?: string; title?: string }) {
  const sheetWidth = 1024;
  const sheetHeight = 8768;
  const scale = size / 64;
  const bgWidth = sheetWidth * scale;
  const bgHeight = sheetHeight * scale;
  const bgX = -col * 64 * scale;
  const bgY = -row * 64 * scale;

  return (
    <div
      title={title}
      aria-hidden="true"
      className={`inline-block shrink-0 overflow-hidden ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(/assets/aistudio/64x64_222023d9.png)`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundSize: `${bgWidth}px ${bgHeight}px`,
        imageRendering: 'pixelated',
      }}
    />
  );
}

export function TitleEmblemSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 540 175"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Frostwood Tycoon"
      {...props}
    >
      <g transform="translate(8, 12)">
        <path
          d="M42 4 L64 36 H51 L70 64 H54 L74 92 H10 L30 64 H14 L33 36 H20 L42 4 Z"
          fill="#264e3e"
          stroke="#132232"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M42 6 L53 23 C46 21 38 21 31 23 L42 6 Z"
          fill="#f4f8fc"
        />
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
    <img
      src="/assets/aistudio/wood_529d4195.png"
      alt="Wood"
      title="Wood"
      className={`inline-block object-contain ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

export function StoneIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <img
      src="/assets/aistudio/stone_09c60a28.png"
      alt="Stone"
      title="Stone"
      className={`inline-block object-contain ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

export function IceIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <img
      src="/assets/aistudio/Ice_Shards_63ed8302.png"
      alt="Ice Shards"
      title="Ice Shards"
      className={`inline-block object-contain ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

export function PeltIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <img
      src="/assets/aistudio/Pelts_0c56dd03.png"
      alt="Pelts"
      title="Pelts"
      className={`inline-block object-contain ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

export function MeatIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <img
      src="/assets/aistudio/Meat_58c37154.png"
      alt="Wild Meat"
      title="Wild Meat"
      className={`inline-block object-contain ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

export function GoldIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <img
      src="/assets/aistudio/Coins_b99c1656.png"
      alt="Gold Coins"
      title="Gold Coins"
      className={`inline-block object-contain ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

export function GearIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <SpriteIcon col={3} row={0} size={20} className={className} title="Clockwork Gear" />;
}

export function AxeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <SpriteIcon col={0} row={14} size={20} className={className} title="Axe" />;
}

export function BowIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return <SpriteIcon col={4} row={14} size={20} className={className} title="Bow" />;
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
