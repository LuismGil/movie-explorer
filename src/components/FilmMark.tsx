export function FilmMark({ className = '' }: { className?: string }) {
  return <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="26" height="26" rx="7" stroke="currentColor" strokeWidth="1.5" />
    <path d="m13 10 9 6-9 6V10Z" fill="currentColor" />
    <path d="M7 8v3m0 4v3m0 4v2M25 8v3m0 4v3m0 4v2" stroke="currentColor" strokeWidth="1.5" />
  </svg>;
}
