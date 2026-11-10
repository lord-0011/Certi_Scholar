const PATHS = {
  home: 'M2.5 7 8 2.5 13.5 7v6.5h-4V10h-3v3.5h-4z',
  user: 'M8 7.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5zM2.75 14c.6-2.9 2.6-4.25 5.25-4.25s4.65 1.35 5.25 4.25',
  file: 'M4 1.75h5.5L13 5.25v9H4zM9.5 1.75v3.5H13M6.5 8.5h4M6.5 11h4',
  inbox: 'M2 9.5 4 3h8l2 6.5v4H2zM2 9.5h3.5l1 1.75h3l1-1.75H14',
  check: 'M2.5 2.5h11v11h-11zM5.5 8l1.75 1.75L10.75 6',
  chart: 'M2.5 13.5h11M4.5 11V8M8 11V4.5M11.5 11V6.5',
  layers: 'M8 2 14 5.25 8 8.5 2 5.25zM2 8.25l6 3.25 6-3.25M2 11.25l6 3.25 6-3.25',
  sliders: 'M3 4h6M12 4h1M3 8h2M8 8h5M3 12h7M13 12h0M10.5 2.5v3M6.5 6.5v3M11.5 10.5v3',
  users: 'M6 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM1.75 13.5c.5-2.5 2.2-3.75 4.25-3.75s3.75 1.25 4.25 3.75M10.5 2.75a2.25 2.25 0 0 1 0 4.5M12 9.9c1.3.5 2 1.7 2.25 3.6',
  list: 'M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01',
  upload: 'M8 10.5V2.5M5 5.5l3-3 3 3M2.5 10v3.5h11V10',
  bell:'M4 11V7a4 4 0 0 1 8 0v4l1.25 1.5H2.75zM6.5 14h3',
  clock: 'M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM8 4.5V8l2.5 1.5',
  award: 'M8 10a3.75 3.75 0 1 0 0-7.5A3.75 3.75 0 0 0 8 10zM5.75 9.25 4.5 14.5 8 12.5l3.5 2-1.25-5.25',
  sun: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M3.4 12.6l1.06-1.06M11.54 4.46l1.06-1.06',
  moon: 'M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}
