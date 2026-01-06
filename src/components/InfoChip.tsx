type InfoChipProps = {
  label: string;
};

export function InfoChip({ label }: InfoChipProps) {
  return (
    <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-200">
      {label}
    </span>
  );
}
