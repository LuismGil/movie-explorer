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
        className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-100 disabled:opacity-40"
      >
        Anterior
      </button>
      <span className="text-sm text-slate-300">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages}
        className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-100 disabled:opacity-40"
      >
        Próxima
      </button>
    </div>
  );
}

export default PaginationBar;
