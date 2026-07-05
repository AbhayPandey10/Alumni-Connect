import { useState, useEffect, useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, Inbox, GraduationCap, Building2 } from 'lucide-react';

const STATUSES = ['Pending', 'Reviewed', 'Referred', 'Interviewing', 'Hired', 'Rejected'];
const SUCCESS = ['Referred', 'Interviewing', 'Hired'];

const StatusBadge = ({ status }) => {
  const isSuccess = SUCCESS.includes(status);
  const cls = isSuccess
    ? 'bg-ink text-paper'
    : status === 'Rejected'
      ? 'bg-paper-2 text-muted line-through'
      : 'bg-paper-2 text-muted';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}>{status}</span>;
};

const ReferralInboxPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const fetchReceived = async () => {
      try {
        const { data } = await axiosInstance.get('/referrals/received');
        setRequests(data.requests || []);
      } catch (error) {
        console.error('Failed to load referral requests:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReceived();
  }, []);

  // Live stats derived from current list
  const stats = useMemo(() => {
    const total = requests.length;
    const successful = requests.filter((r) => SUCCESS.includes(r.status)).length;
    const pending = requests.filter((r) => r.status === 'Pending').length;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : null;
    return { total, successful, pending, successRate };
  }, [requests]);

  const updateStatus = async (id, status) => {
    const prev = requests;
    setSavingId(id);
    setRequests((rs) => rs.map((r) => (r._id === id ? { ...r, status } : r)));
    try {
      await axiosInstance.patch(`/referrals/${id}/status`, { status });
    } catch (error) {
      console.error('Failed to update status:', error);
      setRequests(prev); // revert on failure
    } finally {
      setSavingId(null);
    }
  };

  // Alumni only (checked after all hooks to respect the Rules of Hooks)
  if (user && user.role !== 'Alumni') return <Navigate to="/dashboard" replace />;

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-ink" size={32} /></div>;

  const studentName = (s) => (s?.firstName ? `${s.firstName} ${s.lastName || ''}`.trim() : (s?.username || s?.email?.split('@')[0] || 'Student'));

  return (
    <div className="shell max-w-4xl py-14">
      <header className="animate-fade-up border-b border-line pb-8">
        <div className="eyebrow"><Inbox size={13} /> Referrals</div>
        <h1 className="display mt-5 text-5xl md:text-6xl">Referral requests</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          Students who requested a referral from you. Keep each request updated — your outcomes build
          your referral success rate and boost your postings’ priority on the board.
        </p>
      </header>

      {/* Stats */}
      <div className="animate-fade-up mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-4">
        {[
          { label: 'Total requests', value: stats.total },
          { label: 'Successful', value: stats.successful },
          { label: 'Pending', value: stats.pending },
          { label: 'Success rate', value: stats.successRate == null ? '—' : `${stats.successRate}%` },
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
            <p className="font-serif text-lg italic text-muted">No referral requests yet.</p>
            <p className="mt-2 text-sm text-muted">When students request referrals on your postings, they’ll appear here.</p>
          </div>
        ) : (
          requests.map((r, i) => (
            <div key={r._id} className="animate-fade-up card p-6" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link to={`/u/${r.student?._id}`} className="group flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper-2 text-sm font-bold uppercase text-ink">
                      {r.student?.firstName?.[0]}{r.student?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-ink group-hover:underline">{studentName(r.student)}</p>
                      <p className="text-xs text-muted">@{r.student?.username || 'student'}{r.student?.graduationYear ? ` · Class of ${r.student.graduationYear}` : ''}</p>
                    </div>
                  </Link>
                </div>
                <StatusBadge status={r.status} />
              </div>

              {r.opportunity && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                  <Building2 size={14} />
                  <span className="font-medium text-text">{r.opportunity.role}</span> · {r.opportunity.company}
                </div>
              )}

              {r.message && (
                <p className="mt-3 rounded-lg border border-line bg-paper-2 p-4 text-sm leading-relaxed text-text">{r.message}</p>
              )}

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                <span className="text-xs text-muted">
                  Requested {new Date(r.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted">Update status</label>
                  <select
                    className="field w-auto py-1.5 text-sm"
                    value={r.status}
                    disabled={savingId === r._id}
                    onChange={(e) => updateStatus(r._id, e.target.value)}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {savingId === r._id && <Loader2 size={14} className="animate-spin text-muted" />}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-8 flex items-center gap-2 text-xs text-muted">
        <GraduationCap size={13} />
        Marking a request as Referred, Interviewing, or Hired counts toward your success rate.
      </p>
    </div>
  );
};

export default ReferralInboxPage;
