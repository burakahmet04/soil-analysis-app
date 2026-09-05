type IkonProps = { className?: string };

const ortakOzellikler = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
};

export function YaprakIkonu({ className }: IkonProps) {
  return (
    <svg {...ortakOzellikler} className={className} aria-hidden="true">
      <path d="M20.5 3.5c.6 6-1.2 11-5 14.5-3 2.7-7 3.3-9.5 2.5-.8-2.5-.2-6.5 2.5-9.5C11.9 7.7 16.5 5.9 20.5 3.5Z" />
      <path d="M5.5 20.5c2-3.5 5-6.5 8.5-8.5" />
    </svg>
  );
}

export function YukleIkonu({ className }: IkonProps) {
  return (
    <svg {...ortakOzellikler} className={className} aria-hidden="true">
      <path d="M12 15.5V4M12 4 7.5 8.5M12 4l4.5 4.5" />
      <path d="M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function IndirIkonu({ className }: IkonProps) {
  return (
    <svg {...ortakOzellikler} className={className} aria-hidden="true">
      <path d="M12 4v11.5M12 15.5 7.5 11M12 15.5 16.5 11" />
      <path d="M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export function PaylasIkonu({ className }: IkonProps) {
  return (
    <svg {...ortakOzellikler} className={className} aria-hidden="true">
      <path d="M7 12.5 17 7M7 11.5 17 17" />
      <circle cx="18.5" cy="5.5" r="2" />
      <circle cx="18.5" cy="18.5" r="2" />
      <circle cx="5.5" cy="12" r="2" />
    </svg>
  );
}

export function UyariIkonu({ className }: IkonProps) {
  return (
    <svg {...ortakOzellikler} className={className} aria-hidden="true">
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <path d="M12 10v4.5" />
      <circle cx="12" cy="17.5" r="0.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TakvimIkonu({ className }: IkonProps) {
  return (
    <svg {...ortakOzellikler} className={className} aria-hidden="true">
      <rect x="4" y="5.5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3.5v3.5M16 3.5v3.5" />
    </svg>
  );
}

export function EtiketIkonu({ className }: IkonProps) {
  return (
    <svg {...ortakOzellikler} className={className} aria-hidden="true">
      <path d="M11.5 4.5H6a1.5 1.5 0 0 0-1.5 1.5v5.5c0 .4.16.78.44 1.06l8 8a1.5 1.5 0 0 0 2.12 0l5.5-5.5a1.5 1.5 0 0 0 0-2.12l-8-8a1.5 1.5 0 0 0-1.06-.44Z" />
      <circle cx="9" cy="9" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function KontrolIkonu({ className }: IkonProps) {
  return (
    <svg {...ortakOzellikler} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3 4.7-5.1" />
    </svg>
  );
}

export function BelgeIkonu({ className }: IkonProps) {
  return (
    <svg {...ortakOzellikler} className={className} aria-hidden="true">
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5V8h4" />
      <path d="M9 13h6M9 16.5h6" />
    </svg>
  );
}
