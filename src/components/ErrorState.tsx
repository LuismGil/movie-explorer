import { messages } from '@/i18n';
import Link from 'next/link';
import { FilmMark } from './FilmMark';

type ErrorStateProps = {
  message?: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="cinema-empty glass" role="alert">
      <FilmMark />
      <h2>{messages.error.cinemaTitle}</h2>
      <p>{message ?? messages.error.cinemaDescription}</p>
      <Link href="/" className="cinema-text-link">{messages.common.backToCatalog}</Link>
    </div>
  );
}
