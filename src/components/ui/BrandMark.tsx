// File: src/components/ui/BrandMark.tsx
/** Three stacked layers: the site's mark, also used as the favicon. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M16 5 27 10.5 16 16 5 10.5Z" fill="currentColor" />
      <path
        d="M5 15.5 16 21 27 15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M5 20.5 16 26 27 20.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.45"
      />
    </svg>
  );
}