import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

// Shows email-verification status on the profile. When unverified, sends an OTP
// and routes to the verification page.
const EmailVerificationTag = () => {
  const { user, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (user?.isEmailVerified) {
    return <span className="badge-verify mt-1"><ShieldCheck size={12} /> Email verified</span>;
  }

  const start = async () => {
    setBusy(true);
    try {
      await resendOtp(user.email);
      navigate('/verify', { state: { email: user.email } });
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <span className="badge"><AlertCircle size={12} /> Not verified</span>
      <button
        onClick={start}
        disabled={busy}
        className="inline-flex items-center gap-1 text-xs font-semibold text-ink underline underline-offset-2 disabled:opacity-50"
      >
        {busy && <Loader2 size={11} className="animate-spin" />} Verify now
      </button>
    </div>
  );
};

export default EmailVerificationTag;
