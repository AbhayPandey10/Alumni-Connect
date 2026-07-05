import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { Loader2, Users, Check, X, UserRound } from 'lucide-react';

const nameOf = (u) => (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u?.username || 'Member'));
const initialsOf = (u) => (`${u?.firstName?.[0] || ''}${u?.lastName?.[0] || ''}`.toUpperCase() || nameOf(u)[0]?.toUpperCase());

const Avatar = ({ user }) => (
  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-paper-2 text-sm font-bold uppercase text-ink">
    {initialsOf(user)}
  </div>
);

const NetworkPage = () => {
  const [pending, setPending] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        axiosInstance.get('/connections/pending'),
        axiosInstance.get('/connections'),
      ]);
      setPending(p.data || []);
      setConnections(c.data || []);
    } catch (e) {
      console.error('Failed to load network:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const respond = async (connectionId, action, user) => {
    setBusyId(connectionId);
    try {
      await axiosInstance.put(`/connections/${connectionId}/respond`, { action });
      setPending((ps) => ps.filter((r) => r.connectionId !== connectionId));
      if (action === 'accept') {
        setConnections((cs) => [{ connectionId, user, since: new Date().toISOString() }, ...cs]);
      }
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setBusyId(null); }
  };

  const remove = async (connectionId) => {
    if (!window.confirm('Remove this connection?')) return;
    setBusyId(connectionId);
    try {
      await axiosInstance.delete(`/connections/${connectionId}`);
      setConnections((cs) => cs.filter((c) => c.connectionId !== connectionId));
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setBusyId(null); }
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-ink" size={32} /></div>;

  return (
    <div className="shell max-w-4xl py-14">
      <header className="animate-fade-up border-b border-line pb-8">
        <div className="eyebrow"><Users size={13} /> Network</div>
        <h1 className="display mt-5 text-5xl md:text-6xl">Your network</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          Accept incoming requests and manage the students and alumni you’re connected with.
        </p>
      </header>

      {/* Incoming requests */}
      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Requests</h2>
          <span className="font-serif text-sm text-muted/60">{pending.length}</span>
        </div>
        {pending.length === 0 ? (
          <div className="card p-6 text-sm text-muted">No pending requests.</div>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.connectionId} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <Link to={`/u/${r.user?._id}`} className="group flex items-center gap-3">
                  <Avatar user={r.user} />
                  <div>
                    <p className="font-semibold text-ink group-hover:underline">{nameOf(r.user)}</p>
                    <p className="text-xs text-muted">{r.user?.role} · @{r.user?.username}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <button onClick={() => respond(r.connectionId, 'accept', r.user)} disabled={busyId === r.connectionId} className="btn-primary py-2"><Check size={15} /> Accept</button>
                  <button onClick={() => respond(r.connectionId, 'reject')} disabled={busyId === r.connectionId} className="btn-ghost py-2"><X size={15} /> Ignore</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Connections */}
      <section className="mt-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Connections</h2>
          <span className="font-serif text-sm text-muted/60">{connections.length}</span>
        </div>
        {connections.length === 0 ? (
          <div className="card flex flex-col items-start gap-3 p-6 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted">You haven’t connected with anyone yet.</p>
            <Link to="/directory" className="btn-secondary shrink-0"><UserRound size={15} /> Find people</Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {connections.map((c) => (
              <div key={c.connectionId} className="card flex items-center justify-between gap-3 p-4">
                <Link to={`/u/${c.user?._id}`} className="group flex min-w-0 items-center gap-3">
                  <Avatar user={c.user} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink group-hover:underline">{nameOf(c.user)}</p>
                    <p className="truncate text-xs text-muted">{c.user?.role} · @{c.user?.username}</p>
                  </div>
                </Link>
                <button onClick={() => remove(c.connectionId)} disabled={busyId === c.connectionId} className="btn-ghost shrink-0 py-1.5 text-xs">Remove</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default NetworkPage;
