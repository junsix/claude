interface FileChipProps {
  name: string;
  onRemove?: () => void;
}

export function FileChip({ name, onRemove }: FileChipProps) {
  return (
    <div className="inline-flex items-center gap-1 bg-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-300">
      <span className="truncate max-w-32">{name}</span>
      {onRemove && (
        <button className="text-zinc-500 hover:text-zinc-300" onClick={onRemove}>x</button>
      )}
    </div>
  );
}
