export default function AcademyEmblem() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="academy-emblem-field" x1="10" y1="8" x2="53" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#315CA8" />
          <stop offset="1" stopColor="#172F62" />
        </linearGradient>
        <linearGradient id="academy-emblem-gold" x1="13" y1="9" x2="50" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF0BC" />
          <stop offset=".48" stopColor="#E4BD64" />
          <stop offset="1" stopColor="#B98131" />
        </linearGradient>
        <linearGradient id="academy-emblem-shield" x1="22" y1="16" x2="42" y2="49" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3D6BB8" />
          <stop offset="1" stopColor="#204783" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#academy-emblem-field)" stroke="url(#academy-emblem-gold)" strokeWidth="1.8" />
      <circle cx="32" cy="32" r="26.4" stroke="#F7E5B0" strokeOpacity=".6" strokeWidth=".8" />

      <g stroke="url(#academy-emblem-gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.7 47.8c-5.1-5.2-7.4-12.1-6.5-19.4" />
        <path d="M46.3 47.8c5.1-5.2 7.4-12.1 6.5-19.4" />
        <path d="M14 39.8c-3.1-.2-5.3-1.8-6.7-4.8 3.4.2 5.8 1.4 7.4 3.9M12.1 32.1c-2.7-1.4-4.1-3.8-4.2-7 3 1.2 4.7 3.1 5.4 6.1M13.5 24.4c-2.2-2.1-2.8-4.8-1.9-7.8 2.6 2 3.7 4.4 3.4 7.5M16.1 43.5c-2.8 1.1-5.4.6-7.8-1.4 3-1.3 5.5-1.1 7.8.5" />
        <path d="M50 39.8c3.1-.2 5.3-1.8 6.7-4.8-3.4.2-5.8 1.4-7.4 3.9M51.9 32.1c2.7-1.4 4.1-3.8 4.2-7-3 1.2-4.7 3.1-5.4 6.1M50.5 24.4c2.2-2.1 2.8-4.8 1.9-7.8-2.6 2-3.7 4.4-3.4 7.5M47.9 43.5c2.8 1.1 5.4.6 7.8-1.4-3-1.3-5.5-1.1-7.8.5" />
      </g>

      <path d="M32 12.5 44.4 17v12.1c0 8.2-4.8 14.9-12.4 19.4-7.6-4.5-12.4-11.2-12.4-19.4V17L32 12.5Z" fill="url(#academy-emblem-shield)" stroke="url(#academy-emblem-gold)" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m32 20.2 2.6 5.1 5.7.8-4.2 4.1 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.2-4.1 5.7-.8 2.6-5.1Z" fill="url(#academy-emblem-gold)" />
      <path d="M26.5 41.6h11M28.5 44.6h7" stroke="#F5DEA0" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
