"use client";

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { catalogMessages as messages } from '@/i18n/catalog';

interface PaginationBarProps {
  page: number;
  totalPages: number;
}

export function PaginationBar({ page, totalPages }: PaginationBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <nav className="cinema-pagination" aria-label={messages.pagination.label}>
      <button
        type="button"
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        aria-label={messages.pagination.goToPage(page - 1)}
        className="pagination-button"
      >
        {messages.pagination.previous}
      </button>
      <span className="pagination-info">
        {messages.pagination.pageInfo(page, totalPages)}
      </span>
      <button
        type="button"
        onClick={() => handlePageChange(page + 1)}
        disabled={page === totalPages}
        aria-label={messages.pagination.goToPage(page + 1)}
        className="pagination-button"
      >
        {messages.pagination.next}
      </button>
    </nav>
  );
}

export default PaginationBar;
