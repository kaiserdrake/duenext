const ICON_PATHS: Record<string, React.ReactNode> = {
  document: (
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
    </>
  ),
  bill: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  subscription: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  appointment: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  event: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path
        d="M12 13l.94 1.9 2.1.31-1.52 1.48.36 2.09L12 17.77l-1.88 1.01.36-2.09-1.52-1.48 2.1-.31z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
};

// Anything unrecognized (including a custom category someone typed, or "Other")
// falls back to a generic tag/label mark.
const DEFAULT_ICON = (
  <>
    <path d="M12.6 2.6a2 2 0 0 0-1.4-.6H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8 8a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8z" />
    <circle cx="7.5" cy="7.5" r="1.3" fill="currentColor" stroke="none" />
  </>
);

export default function CategoryIcon({
  category,
  className,
}: {
  category: string | null;
  className?: string;
}) {
  const key = (category ?? "").trim().toLowerCase();
  const paths = ICON_PATHS[key] ?? DEFAULT_ICON;

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths}
    </svg>
  );
}
