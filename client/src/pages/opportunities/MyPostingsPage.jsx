import { useState, useEffect, useMemo } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Plus, Edit3, Eye, EyeOff, Trash2, Calendar, Users, ExternalLink } from 'lucide-react';

const MyPostingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [postings, setPostings] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const fetchMine = async () => {
      try {
        const { data } = await axiosInstance.get('/opportunities/mine');
        setPostings(data || []);
      } catch (error) {
        console.error('Failed to load your postings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMine();
  }, []);

  const stats = useMemo(() => {
    const total = postings.length;
    const active = postings.filter((o) => o.isActive).length;
    const requests = postings.reduce((s, o) => s + (o.requestedCount || 0), 0);
    return { total, active, requests };
  }, [postings]);

  // Alumni only (after hooks)
  if (user && user.role !== 'Alumni') return <Navigate to="/dashboard" replace />;

  const toggleActive = async (id, next) => {
    setBusyId(id);
    try {
      await axiosInstance.patch(`/opportunities/${id}/active`, { isActive: next });
      setPostings((ps) => ps.map((o) => (o._id === id ? { ...o, isActive: next } : o)));
    } catch (e) { alert(e.response?.data?.message || 'Failed to update'); }
    finally { setBusyId(null); }
  };

  const removePosting = async (id, label) => {
    if (!window.confirm(`Delete "${label}"? This also removes its referral requests. This cannot be undone.`)) return;
    setBusyId(id);
    try {
      await axiosInstance.delete(`/opportunities/${id}`);
      setPostings((ps) => ps.filter((o) => o._id !== id));
    } catch (e) { alert(e.response?.data?.message || 'Failed to delete'); }
    finally { setBusyId(null); }
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-ink" size={32} /></div>;

  return (
    <div className="shell max-w-4xl py-14">
      <header className="animate-fade-up flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow"><span className="h-1 w-1 rounded-full bg-ink" /> Your postings</div>
          <h1 className="display mt-5 text-5xl md:text-6xl">My postings</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
            View, edit, hide, or remove the opportunities you’ve shared. Review incoming requests in the
            <Link to="/referrals" className="text-ink underline underline-offset-2"> Referral inbox</Link>.
          </p>
        </div>
        <Link to="/post-job" className="btn-primary self-start"><Plus size={16} /> Post an opportunity</Link>
      </header>

      {/* Summary */}
      <div className="animate-fade-up mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
        {[
          { label: 'Total postings', value: stats.total },
          { label: 'Active', value: stats.active },
          { label: 'Referral requests', value: stats.requests },
        ].map((s) => (
          <div key={s.label} className="bg-card p-5">
            <p className="text-3xl font-bold tracking-tight text-ink tabular-nums">{s.value}</p>
            <p className="mt-1 text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {postings.length === 0 ? (
          <div className="card py-16 text-center">
            <p className="font-serif text-lg italic text-muted">You haven’t posted any opportunities yet.</p>
            <Link to="/post-job" className="btn-secondary mt-5">Post your first opportunity</Link>
          </div>
        ) : (
          postings.map((o, i) => (
            <div key={o._id} className="animate-fade-up card p-5" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink">{o.role} · {o.company}</h3>
                    <span className="badge">{o.type}</span>
                    {!o.isActive && <span className="badge">Hidden</span>}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1"><Users size={12} /> {o.requestedCount} request{o.requestedCount === 1 ? '' : 's'}</span>
                    {o.deadline && <span className="inline-flex items-center gap-1"><Calendar size={12} /> Deadline {new Date(o.deadline).toLocaleDateString()}</span>}
                    {o.applicationLink && (
                      <a href={o.applicationLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-ink">
                        <ExternalLink size={12} /> Posting
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => navigate(`/edit-job/${o._id}`, { state: { opp: o } })} className="btn-secondary py-2"><Edit3 size={15} /> Edit</button>
                  <button onClick={() => toggleActive(o._id, !o.isActive)} disabled={busyId === o._id} className="btn-secondary py-2">
                    {o.isActive ? <><EyeOff size={15} /> Hide</> : <><Eye size={15} /> Unhide</>}
                  </button>
                  <button onClick={() => removePosting(o._id, `${o.role} · ${o.company}`)} disabled={busyId === o._id} className="btn-ghost py-2"><Trash2 size={15} /> Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyPostingsPage;
