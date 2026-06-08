const PAGINATION_LABELS = {
  previous: 'Anterior',
  next: 'Próxima',
  pageInfo: (page: number, totalPages: number) =>
    `Página ${page} de ${totalPages}`,
  goToPage: (page: number) => `Ir para a página ${page}`,
};

interface PaginationBarProps {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export function PaginationBar({ page, totalPages, setPage }: PaginationBarProps) {
  return (
    <div className="mt-6 flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
        aria-label={PAGINATION_LABELS.goToPage(page - 1)}
        className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-100 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
      >
        {PAGINATION_LABELS.previous}
      </button>
      <span className="text-sm text-slate-300">
        {PAGINATION_LABELS.pageInfo(page, totalPages)}
      </span>
      <button
        type="button"
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages}
        aria-label={PAGINATION_LABELS.goToPage(page + 1)}
        className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-100 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
      >
        {PAGINATION_LABELS.next}
      </button>
    </div>
  );
}

export default PaginationBar;
