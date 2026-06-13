import { messages } from '@/i18n';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-10" role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-400 border-b-transparent" />
      <span className="sr-only">{messages.common.loading}</span>
    </div>
  );
}
