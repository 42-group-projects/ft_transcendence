type CountdownOverlayProps = {
  seconds: number;
};

export function CountdownOverlay({ seconds }: CountdownOverlayProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center">
        <span className="text-7xl font-extrabold text-white drop-shadow-lg">{seconds}</span>
        <span className="mt-2 text-lg font-medium text-indigo-300">Get Ready!</span>
      </div>
    </div>
  );
}
