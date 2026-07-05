// Abstract monochrome "relationship map" — nodes connected by hairlines.
// Used as editorial artwork on auth / marketing panels. No gradients, no color
// except a single forest-green verification ring.

const NODES = [
  { x: 210, y: 60, r: 5 },
  { x: 90, y: 130, r: 4 },
  { x: 320, y: 150, r: 6, verified: true },
  { x: 160, y: 210, r: 8, hub: true },
  { x: 300, y: 280, r: 4 },
  { x: 70, y: 300, r: 5 },
  { x: 240, y: 350, r: 6 },
  { x: 360, y: 70, r: 3 },
];

const LINKS = [
  [3, 0], [3, 1], [3, 2], [3, 4], [3, 5], [3, 6],
  [0, 2], [2, 4], [4, 6], [1, 5], [2, 7],
];

const NetworkMotif = ({ className = '' }) => (
  <div className={`pointer-events-none select-none ${className}`}>
    {/* Slow-rotating concentric rings for depth */}
    <div
      className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line/70"
      style={{ animation: 'ringSpin 80s linear infinite' }}
    />
    <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line/50" />

    <svg viewBox="0 0 420 420" className="animate-float absolute inset-0 h-full w-full">
      <g stroke="var(--color-line-strong)" strokeWidth="1">
        {LINKS.map(([a, b], i) => (
          <line key={i} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} />
        ))}
      </g>
      {NODES.map((n, i) => (
        <g key={i}>
          {n.verified && (
            <circle cx={n.x} cy={n.y} r={n.r + 6} fill="none" stroke="var(--color-verify)" strokeWidth="1.5" />
          )}
          <circle
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={n.hub ? 'var(--color-ink)' : 'var(--color-muted)'}
          />
        </g>
      ))}
    </svg>
  </div>
);

export default NetworkMotif;
