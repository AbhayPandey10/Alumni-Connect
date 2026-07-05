import { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ShieldCheck, Loader2, MailCheck } from 'lucide-react';
import NetworkMotif from '../../components/NetworkMotif';

const VerifyOtpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const { verifyOtp, resendOtp } = useContext(AuthContext);

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // No email in navigation state (e.g. page refresh) — send them back to log in
  if (!email) return <Navigate to="/login" replace />;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp(email, code.trim());
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    setResending(true);
    try {
      await resendOtp(email);
      setInfo('A new code has been sent.');
      setCooldown(30);
    } catch (err) {
      setError(err);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r border-line bg-paper-2 lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" />
        <NetworkMotif className="absolute inset-0 opacity-70" />
        <div className="relative"><div className="eyebrow"><span className="h-1 w-1 rounded-full bg-ink" /> Secure sign-in</div></div>
        <div className="relative">
          <h2 className="display text-6xl">Check your<br />inbox.</h2>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted">
            We sent a 6-digit verification code to keep your account secure. Enter it to continue.
          </p>
        </div>
        <div className="relative"><span className="badge-verify"><ShieldCheck size={13} /> Verified access</span></div>
      </aside>

      <main className="flex items-center justify-center px-6 py-16 lg:px-14">
        <div className="w-full max-w-sm animate-fade-up">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-paper-2 text-ink">
            <MailCheck size={22} />
          </span>
          <h1 className="display mt-5 text-4xl">Verify your email</h1>
          <p className="mt-2 text-sm text-muted">
            Enter the code sent to <span className="font-medium text-ink">{email}</span>.
          </p>

          {error && <div className="mt-6 rounded-lg border border-line bg-paper-2 px-4 py-3 text-sm text-text">{error}</div>}
          {info && <div className="mt-6 rounded-lg border border-line bg-paper-2 px-4 py-3 text-sm text-text">{info}</div>}

          <form onSubmit={handleVerify} className="mt-8 space-y-5">
            <div>
              <label className="label">Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                maxLength={6}
                required
                className="field text-center text-2xl font-semibold tracking-[0.5em]"
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <button type="submit" disabled={loading || code.length < 6} className="btn-primary w-full disabled:opacity-40">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying…</> : 'Verify & continue'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="font-semibold text-ink underline underline-offset-4 disabled:text-muted disabled:no-underline"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending…' : 'Resend code'}
            </button>
            <button onClick={() => navigate('/login')} className="text-muted hover:text-ink">Back to log in</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerifyOtpPage;
