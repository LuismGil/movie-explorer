"use client";

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { messages } from '@/i18n';

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
    <div className="mt-6 flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        aria-label={messages.pagination.goToPage(page - 1)}
        className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-100 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
      >
        {messages.pagination.previous}
      </button>
      <span className="text-sm text-slate-300">
        {messages.pagination.pageInfo(page, totalPages)}
      </span>
      <button
        type="button"
        onClick={() => handlePageChange(page + 1)}
        disabled={page === totalPages}
        aria-label={messages.pagination.goToPage(page + 1)}
        className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-100 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
      >
        {messages.pagination.next}
      </button>
    </div>
  );
}

export default PaginationBar;
