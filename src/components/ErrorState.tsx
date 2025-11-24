type ErrorStateProps = {
  message?: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-5 text-red-100">
      <div className="font-semibold">Ops! Algo deu errado.</div>
      <p className="text-sm text-red-200/90">{message ?? 'Tente novamente mais tarde.'}</p>
    </div>
  );
}
