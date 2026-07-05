import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { UserPlus, Check, Clock, Loader2 } from 'lucide-react';

// Relationship-aware connect control for a given user.
const ConnectButton = ({ userId }) => {
  const [status, setStatus] = useState(null); 
  const [connectionId, setConnectionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    axiosInstance.get(`/connections/status/${userId}`)
      .then(({ data }) => { if (active) { setStatus(data.status); setConnectionId(data.connectionId || null); } })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [userId]);

  const send = async () => {
    setBusy(true);
    try {
      const { data } = await axiosInstance.post('/connections/request', { recipientId: userId });
      setStatus('pending_outgoing');
      setConnectionId(data._id);
    } catch (e) { alert(e.response?.data?.message || 'Failed to send request'); }
    finally { setBusy(false); }
  };

  const respond = async (action) => {
    setBusy(true);
    try {
      await axiosInstance.put(`/connections/${connectionId}/respond`, { action });
      setStatus(action === 'accept' ? 'connected' : 'none');
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await axiosInstance.delete(`/connections/${connectionId}`);
      setStatus('none');
      setConnectionId(null);
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  if (loading || !status || status === 'self') return null;

  if (status === 'none') {
    return <button onClick={send} disabled={busy} className="btn-primary disabled:opacity-50">
      {busy ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Connect
    </button>;
  }

  if (status === 'pending_outgoing') {
    return <button onClick={remove} disabled={busy} className="btn-secondary" title="Withdraw request">
      <Clock size={15} /> Requested
    </button>;
  }

  if (status === 'pending_incoming') {
    return (
      <div className="flex items-center gap-2">
        <button onClick={() => respond('accept')} disabled={busy} className="btn-primary disabled:opacity-50">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Accept
        </button>
        <button onClick={() => respond('reject')} disabled={busy} className="btn-ghost">Ignore</button>
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <div className="flex items-center gap-2">
        <span className="badge-verify"><Check size={12} /> Connected</span>
        <button onClick={remove} disabled={busy} className="btn-ghost text-xs">Remove</button>
      </div>
    );
  }

  return null;
};

export default ConnectButton;
