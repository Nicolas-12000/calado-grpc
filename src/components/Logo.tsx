export function Mark({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={className ? undefined : size}
      height={className ? undefined : size}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="12" fill="var(--lake-dark)" />
      <path
        d="M14 8v32M14 12h7M14 20h7M14 28h7M14 36h7"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M6 30q6-7 12 0t12 0 12 0"
        fill="none"
        stroke="var(--sand)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
