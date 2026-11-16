export function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
      <path d="M9.9 5.3A10.5 10.5 0 0112 5c5 0 9 4 10 7a13 13 0 01-3.1 4.2M6.2 6.2C4.3 7.5 2.8 9.6 2 12c1 3 5 7 10 7 1.7 0 3.3-.4 4.7-1.2" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
