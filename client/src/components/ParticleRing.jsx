// Abstract monochrome particle swirl — hundreds of tiny dots arranged in a ring
// to read as a dense "constellation of connections". No gradients; density and
// opacity variation create depth. Slowly rotates.

const CENTER = 200;

const POINTS = (() => {
  const pts = [];
  const count = 560;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Cluster particles into a ring band (~radius 95–205) with soft edges
    const t = Math.random();
    const radius = 95 + Math.pow(t, 0.65) * 115;
    const cx = CENTER + Math.cos(angle) * radius;
    const cy = CENTER + Math.sin(angle) * radius * 0.92;
    const r = 0.35 + Math.random() * 1.35;
    // Fade particles toward the inner/outer edges of the band
    const edge = 1 - Math.abs(radius - 150) / 60;
    const opacity = Math.max(0.06, Math.min(0.72, 0.1 + edge * 0.55 * Math.random() + 0.12));
    pts.push({ cx, cy, r, opacity });
  }
  return pts;
})();

const ParticleRing = ({ className = '' }) => (
  <div className={`pointer-events-none select-none ${className}`}>
    <svg viewBox="0 0 400 400" className="h-full w-full">
      {/* faint guide rings for architectural depth */}
      <circle cx={CENTER} cy={CENTER} r="150" fill="none" stroke="var(--color-line)" strokeWidth="1" opacity="0.5" />
      <circle cx={CENTER} cy={CENTER} r="96" fill="none" stroke="var(--color-line)" strokeWidth="1" opacity="0.35" />
      <g style={{ transformOrigin: '200px 200px', animation: 'ringSpin 90s linear infinite' }}>
        {POINTS.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="var(--color-ink)" opacity={p.opacity} />
        ))}
      </g>
    </svg>
  </div>
);

export default ParticleRing;
