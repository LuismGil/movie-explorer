type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-5 text-red-100">
      <div className="font-semibold">Ops! Algo deu errado.</div>
      <p className="text-sm text-red-200/90">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-3 rounded-full bg-red-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-400"
          type="button"
        >
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}
