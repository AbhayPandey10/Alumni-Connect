const Empty = ({ label = 'No data yet' }) => (
  <p className="py-6 text-center font-serif text-sm italic text-muted">{label}</p>
);

export const Panel = ({ title, subtitle, right, children, className = '' }) => (
  <section className={`card p-6 ${className}`}>
    <div className="mb-5 flex items-baseline justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </section>
);

export const Stat = ({ label, value, sub }) => (
  <div className="rounded-xl border border-line bg-card p-5">
    <p className="text-xs text-muted">{label}</p>
    <p className="mt-1.5 text-3xl font-bold tracking-tight text-ink tabular-nums">{value}</p>
    {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
  </div>
);

export const BarList = ({ data, suffix = '', empty }) => {
  if (!data?.length) return <Empty label={empty} />;
  const max = Math.max(...data.map((d) => d.value || 0), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-text">{d.label}</span>
            <span className="shrink-0 font-serif tabular-nums text-muted">
              {d.value == null ? '—' : d.value}{d.value == null ? '' : suffix}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-paper-2">
            <div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(3, ((d.value || 0) / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// Vertical bar trend
export const TrendBars = ({ data, empty }) => {
  if (!data?.length) return <Empty label={empty} />;
  const max = Math.max(...data.map((d) => d.value || 0), 1);
  return (
    <div className="flex h-44 items-end gap-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[10px] font-medium tabular-nums text-ink">{d.value}</span>
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-ink"
              style={{ height: `${Math.max(4, ((d.value || 0) / max) * 100)}%`, opacity: 0.55 + 0.45 * ((d.value || 0) / max) }}
            />
          </div>
          <span className="text-[10px] text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

const SHADES = [1, 0.72, 0.52, 0.36, 0.24, 0.15];

// Monochrome donut with legend
export const Donut = ({ data, empty }) => {
  const segments = (data || []).filter((d) => d.value > 0);
  if (!segments.length) return <Empty label={empty} />;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
      <svg viewBox="0 0 100 100" className="h-32 w-32 shrink-0 -rotate-90">
        {segments.map((s, i) => {
          const len = (s.value / total) * C;
          const el = (
            <circle
              key={i}
              cx="50" cy="50" r={R} fill="none"
              stroke="var(--color-ink)" strokeWidth="14"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
              opacity={SHADES[i] ?? 0.12}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="w-full space-y-1.5">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 truncate text-text">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-ink" style={{ opacity: SHADES[i] ?? 0.12 }} />
              {s.label}
            </span>
            <span className="shrink-0 font-serif tabular-nums text-muted">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
