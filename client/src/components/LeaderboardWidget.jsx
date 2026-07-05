import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Trophy } from 'lucide-react';

const nameOf = (u) => (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u?.username || u?.email?.split('@')[0] || 'Alumni'));
const initialsOf = (u) => (`${u?.firstName?.[0] || ''}${u?.lastName?.[0] || ''}`.toUpperCase() || nameOf(u)[0]?.toUpperCase());

const LeaderRow = ({ rank, user, points, tier, highlight = false, you = false }) => {
  const isTop = rank === 1;
  return (
    <div
      className={`flex items-center justify-between border-b border-line py-4 last:border-b-0 ${
        highlight ? '-mx-3 rounded-lg border-b-0 bg-paper-2 px-3 ring-1 ring-line-strong' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <span
          className="w-6 text-center font-serif text-lg tabular-nums"
          style={{ color: isTop ? 'var(--color-gold)' : 'var(--color-muted)' }}
        >
          {rank ?? '—'}
        </span>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper-2 text-sm font-semibold uppercase text-ink">
          {initialsOf(user)}
        </div>
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            {nameOf(user)}
            {you && <span className="badge">You</span>}
          </p>
          <p className="text-xs text-muted">
            {user?.username ? `@${user.username} · ` : ''}{rank == null ? 'Unranked' : tier}
          </p>
        </div>
      </div>
      <span className={isTop ? 'badge-gold' : 'badge'}>{points} pts</span>
    </div>
  );
};

const LeaderboardWidget = () => {
  const [leaders, setLeaders] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await axiosInstance.get('/leaderboard');
        setLeaders(data.leaders || []);
        setMe(data.me || null);
      } catch (error) {
        console.error('Failed to fetch leaderboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="mt-16">
        <div className="card h-64 animate-pulse" />
      </div>
    );
  }

  const meId = me?.user?._id;

  return (
    <section className="mt-16">
      <div className="card overflow-hidden p-7 md:p-10">
        <div className="flex items-start justify-between border-b border-line pb-6">
          <div>
            <div className="eyebrow" style={{ color: 'var(--color-gold)' }}>
              <Trophy size={13} />
              Contribution
            </div>
            <h2 className="display mt-3 text-3xl">Top contributors</h2>
            <p className="mt-2 text-sm text-muted">
              Points earned for posting opportunities and for how far their referrals progress.
            </p>
          </div>
          <span className="font-serif text-4xl text-muted/30 md:text-5xl">01</span>
        </div>

        {leaders.length === 0 ? (
          <p className="py-10 text-center font-serif text-lg italic text-muted">
            No contributions yet — be the first to top the board.
          </p>
        ) : (
          <div className="mt-2">
            {leaders.map((l) => (
              <LeaderRow
                key={l.user?._id || l.rank}
                {...l}
                highlight={meId && l.user?._id === meId}
                you={meId && l.user?._id === meId}
              />
            ))}
          </div>
        )}

        {/* Your rank pinned at the bottom when you're outside the visible list */}
        {me && !me.inTop && (
          <div className="mt-2">
            <div className="py-2 text-center font-serif text-lg leading-none text-muted/40">···</div>
            <LeaderRow {...me} highlight you />
          </div>
        )}
      </div>
    </section>
  );
};

export default LeaderboardWidget;
