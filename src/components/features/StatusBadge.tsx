interface Props {
  status: number | null;
}

export default function StatusBadge({ status }: Props) {
  if (status === null) return null;

  let label = '';
  let classes = '';

  if (status === 200) {
    label = '200 OK';
    classes = 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400';
  } else if (status >= 400 && status < 500) {
    label = `${status} Bad Request`;
    classes = 'bg-amber-400/10 border-amber-400/30 text-amber-400';
  } else if (status >= 500) {
    label = `${status} Server Error`;
    classes = 'bg-red-500/10 border-red-500/30 text-red-400';
  } else {
    label = `${status}`;
    classes = 'bg-muted border-border text-muted-foreground';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border mono ${classes}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
