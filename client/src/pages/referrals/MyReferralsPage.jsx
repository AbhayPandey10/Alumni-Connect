import { useState, useEffect, useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Send, Building2, User as UserIcon } from 'lucide-react';

const SUCCESS = ['Referred', 'Interviewing', 'Hired'];

const StatusBadge = ({ status }) => {
  const cls = SUCCESS.includes(status)
    ? 'bg-ink text-paper'
    : status === 'Rejected'
      ? 'bg-paper-2 text-muted line-through'
      : 'bg-paper-2 text-muted';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}>{status}</span>;
};

const MyReferralsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchSent = async () => {
      try {
        const { data } = await axiosInstance.get('/referrals/sent');
        setRequests(data || []);
      } catch (error) {
        console.error('Failed to load your referral requests:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSent();
  }, []);

  const stats = useMemo(() => {
    const total = requests.length;
    const successful = requests.filter((r) => SUCCESS.includes(r.status)).length;
    const pending = requests.filter((r) => r.status === 'Pending').length;
    return { total, successful, pending };
  }, [requests]);

  // Students only (checked after hooks)
  if (user && user.role !== 'Student') return <Navigate to="/dashboard" replace />;

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-ink" size={32} /></div>;

  const alumniName = (a) => (a?.firstName ? `${a.firstName} ${a.lastName || ''}`.trim() : (a?.username || a?.email?.split('@')[0] || 'Alumni'));

  return (
    <div className="shell max-w-4xl py-14">
      <header className="animate-fade-up border-b border-line pb-8">
        <div className="eyebrow"><Send size={13} /> Referrals</div>
        <h1 className="display mt-5 text-5xl md:text-6xl">My requests</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          Track the referral requests you’ve sent and their live status. You’ll be notified whenever an
          alumnus updates one.
        </p>
      </header>

      {/* Summary */}
      <div className="animate-fade-up mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
        {[
          { label: 'Sent', value: stats.total },
          { label: 'Successful', value: stats.successful },
          { label: 'Awaiting response', value: stats.pending },
        ].map((s) => (
          <div key={s.label} className="bg-card p-5">
            <p className="text-3xl font-bold tracking-tight text-ink tabular-nums">{s.value}</p>
            <p className="mt-1 text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Requests */}
      <div className="mt-8 space-y-4">
        {requests.length === 0 ? (
          <div className="card py-20 text-center">
            <p className="font-serif text-lg italic text-muted">You haven’t requested any referrals yet.</p>
            <Link to="/jobs" className="btn-secondary mt-5">Browse opportunities</Link>
          </div>
        ) : (
          requests.map((r, i) => (
            <div key={r._id} className="animate-fade-up card p-6" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-lg font-semibold text-ink">
                    <Building2 size={16} className="text-muted" />
                    {r.opportunity?.role || 'Opportunity'}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {r.opportunity?.company}
                    {r.opportunity?.type ? ` · ${r.opportunity.type}` : ''}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                <UserIcon size={14} /> Referral from{' '}
                <Link to={`/u/${r.alumni?._id}`} className="font-medium text-text underline-offset-2 hover:underline">{alumniName(r.alumni)}</Link>
              </div>

              {/* Status timeline */}
              {r.statusHistory?.length > 0 && (
                <ol className="relative mt-5 ml-2 border-l border-line">
                  {r.statusHistory.map((h, j) => (
                    <li key={j} className="relative pb-4 pl-6 last:pb-0">
                      <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-ink" />
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-medium text-ink">{h.status}</span>
                        {h.updatedAt && (
                          <span className="text-xs text-muted">{new Date(h.updatedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      {h.note && <p className="mt-0.5 text-xs text-muted">{h.note}</p>}
                    </li>
                  ))}
                </ol>
              )}

              <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
                Requested {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyReferralsPage;
