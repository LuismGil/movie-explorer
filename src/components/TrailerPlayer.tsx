type TrailerPlayerProps = {
  videoKey: string;
};

export function TrailerPlayer({ videoKey }: TrailerPlayerProps) {
  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoKey}`}
      className="w-full aspect-video rounded-2xl border border-slate-700"
      allowFullScreen
    />
  );
}

export default TrailerPlayer;
