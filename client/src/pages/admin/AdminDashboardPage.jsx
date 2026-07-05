import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { Stat } from '../../components/charts';
import {
  Shield, Search, RotateCcw, Loader2, Trash2, Eye, EyeOff, Activity, UsersRound, Briefcase,
} from 'lucide-react';

const ROLES = ['Student', 'Alumni', 'Admin'];
const nameOf = (u) => (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u?.username || u?.email?.split('@')[0] || '—'));

const TABS = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'users', label: 'Users', icon: UsersRound },
  { key: 'moderation', label: 'Moderation', icon: Briefcase },
];

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const myId = user?._id || user?.id;
  const [tab, setTab] = useState('overview');

  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [userQuery, setUserQuery] = useState({ search: '', role: '' });
  const [opps, setOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try { const { data } = await axiosInstance.get('/admin/overview'); setOverview(data); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  const loadUsers = useCallback(async (q = userQuery) => {
    setLoading(true);
    try {
      const params = {};
      if (q.search) params.search = q.search;
      if (q.role) params.role = q.role;
      const { data } = await axiosInstance.get('/admin/users', { params });
      setUsers(data.users || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOpps = useCallback(async () => {
    setLoading(true);
    try { const { data } = await axiosInstance.get('/admin/opportunities'); setOpps(data || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'overview') loadOverview();
    if (tab === 'users') loadUsers();
    if (tab === 'moderation') loadOpps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Admin only (after hooks)
  if (user && user.role !== 'Admin') return <Navigate to="/dashboard" replace />;

  const changeRole = async (id, role) => {
    setBusyId(id);
    try {
      await axiosInstance.patch(`/admin/users/${id}/role`, { role });
      setUsers((us) => us.map((u) => (u._id === id ? { ...u, role } : u)));
    } catch (e) { alert(e.response?.data?.message || 'Failed to change role'); }
    finally { setBusyId(null); }
  };

  const removeUser = async (id, label) => {
    if (!window.confirm(`Delete ${label}? This also removes their profile, posts, and referrals. This cannot be undone.`)) return;
    setBusyId(id);
    try { await axiosInstance.delete(`/admin/users/${id}`); setUsers((us) => us.filter((u) => u._id !== id)); }
    catch (e) { alert(e.response?.data?.message || 'Failed to delete user'); }
    finally { setBusyId(null); }
  };

  const toggleActive = async (id, next) => {
    setBusyId(id);
    try {
      await axiosInstance.patch(`/admin/opportunities/${id}/active`, { isActive: next });
      setOpps((os) => os.map((o) => (o._id === id ? { ...o, isActive: next } : o)));
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setBusyId(null); }
  };

  const removeOpp = async (id, label) => {
    if (!window.confirm(`Remove "${label}"? This also deletes its referral requests.`)) return;
    setBusyId(id);
    try { await axiosInstance.delete(`/admin/opportunities/${id}`); setOpps((os) => os.filter((o) => o._id !== id)); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setBusyId(null); }
  };

  const c = overview?.counts;

  return (
    <div className="shell py-14">
      <header className="animate-fade-up border-b border-line pb-8">
        <div className="eyebrow"><Shield size={13} /> Administrator</div>
        <h1 className="display mt-5 text-5xl md:text-6xl">Admin dashboard</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          Manage users, moderate opportunities, and monitor platform activity.
        </p>
      </header>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === t.key ? 'text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            <t.icon size={15} /> {t.label}
            {tab === t.key && <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-ink" />}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-ink" size={28} /></div>
      ) : (
        <div className="mt-8">
          {/* OVERVIEW */}
          {tab === 'overview' && overview && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Stat label="Students" value={c.students} />
                <Stat label="Alumni" value={c.alumni} />
                <Stat label="Admins" value={c.admins} />
                <Stat label="Jobs" value={c.jobsTotal} sub={`${c.jobsActive} active`} />
                <Stat label="Referrals" value={c.refsTotal} />
                <Stat label="Hired" value={overview.referralsByStatus?.Hired || 0} />
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="card p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted">Recent signups</h3>
                  <div className="space-y-3">
                    {overview.recentUsers.map((u) => (
                      <div key={u._id} className="flex items-center justify-between text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{nameOf(u)}</p>
                          <p className="truncate text-xs text-muted">{u.email}</p>
                        </div>
                        <span className="badge shrink-0">{u.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted">Recent postings</h3>
                  <div className="space-y-3">
                    {overview.recentOpportunities.map((o) => (
                      <div key={o._id} className="text-sm">
                        <p className="truncate font-medium text-ink">{o.role} · {o.company}</p>
                        <p className="truncate text-xs text-muted">by {nameOf(o.postedBy)} · {o.isActive ? 'active' : 'hidden'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted">Recent referrals</h3>
                  <div className="space-y-3">
                    {overview.recentReferrals.map((r) => (
                      <div key={r._id} className="flex items-center justify-between gap-2 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{r.opportunity?.role || 'Opportunity'}</p>
                          <p className="truncate text-xs text-muted">{nameOf(r.student)}</p>
                        </div>
                        <span className="badge shrink-0">{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USERS */}
          {tab === 'users' && (
            <div>
              <form
                onSubmit={(e) => { e.preventDefault(); loadUsers(userQuery); }}
                className="mb-5 flex flex-wrap items-center gap-2"
              >
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-card px-3">
                  <Search size={16} className="text-muted" />
                  <input
                    className="w-full bg-transparent py-2 text-sm text-text placeholder:text-muted/60 focus:outline-none"
                    placeholder="Search name, username, or email…"
                    value={userQuery.search}
                    onChange={(e) => setUserQuery({ ...userQuery, search: e.target.value })}
                  />
                </div>
                <select className="field w-auto" value={userQuery.role} onChange={(e) => setUserQuery({ ...userQuery, role: e.target.value })}>
                  <option value="">All roles</option>
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
                <button type="submit" className="btn-primary py-2">Search</button>
                <button type="button" onClick={() => { const q = { search: '', role: '' }; setUserQuery(q); loadUsers(q); }} className="btn-ghost"><RotateCcw size={14} /> Reset</button>
              </form>

              <div className="card overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Role</th>
                      <th className="px-5 py-3 font-medium">Joined</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-10 text-center font-serif italic text-muted">No users found.</td></tr>
                    ) : users.map((u) => {
                      const isSelf = String(u._id) === String(myId);
                      return (
                        <tr key={u._id} className="border-b border-line last:border-b-0">
                          <td className="px-5 py-3">
                            <span className="font-medium text-ink">{nameOf(u)}</span>
                            {isSelf && <span className="badge ml-2">You</span>}
                            <p className="text-xs text-muted">@{u.username}</p>
                          </td>
                          <td className="px-5 py-3 text-muted">{u.email}</td>
                          <td className="px-5 py-3">
                            <select
                              className="field w-auto py-1.5 text-sm disabled:opacity-50"
                              value={u.role}
                              disabled={isSelf || busyId === u._id}
                              onChange={(e) => changeRole(u._id, e.target.value)}
                            >
                              {ROLES.map((r) => <option key={r}>{r}</option>)}
                            </select>
                          </td>
                          <td className="px-5 py-3 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => removeUser(u._id, nameOf(u))}
                              disabled={isSelf || busyId === u._id}
                              className="rounded-md p-2 text-muted transition-colors hover:bg-paper-2 hover:text-ink disabled:opacity-30"
                              title={isSelf ? 'You cannot delete yourself' : 'Delete user'}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODERATION */}
          {tab === 'moderation' && (
            <div className="space-y-3">
              {opps.length === 0 ? (
                <div className="card py-16 text-center font-serif italic text-muted">No opportunities posted.</div>
              ) : opps.map((o) => (
                <div key={o._id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink">{o.role} · {o.company}</p>
                      <span className="badge">{o.type}</span>
                      {!o.isActive && <span className="badge">Hidden</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      by {nameOf(o.postedBy)} · {o.requestedCount} request{o.requestedCount === 1 ? '' : 's'} · {new Date(o.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(o._id, !o.isActive)} disabled={busyId === o._id} className="btn-secondary py-2">
                      {o.isActive ? <><EyeOff size={15} /> Hide</> : <><Eye size={15} /> Unhide</>}
                    </button>
                    <button onClick={() => removeOpp(o._id, `${o.role} · ${o.company}`)} disabled={busyId === o._id} className="btn-ghost py-2">
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
