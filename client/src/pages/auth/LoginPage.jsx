import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { ShieldCheck } from 'lucide-react';
import NetworkMotif from '../../components/NetworkMotif';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login, googleLogin } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      setError(err);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError('');
      await googleLogin(credentialResponse.credential);
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Editorial panel */}
      <aside className="relative hidden overflow-hidden border-r border-line bg-paper-2 lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" />
        <NetworkMotif className="absolute inset-0 opacity-70" />

        <div className="relative">
          <div className="eyebrow">
            <span className="h-1 w-1 rounded-full bg-ink" />
            Verified alumni network
          </div>
        </div>

        <div className="relative">
          <h2 className="display text-6xl">
            Your network.
            <br />
            Your future.
            <br />
            <span className="text-muted">Connected.</span>
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted">
            A trusted college network to discover alumni, request referrals, and grow your
            career — every member verified through their official college email.
          </p>
        </div>

        <div className="relative flex items-center gap-3">
          <span className="badge-verify">
            <ShieldCheck size={13} />
            100% verified members
          </span>
        </div>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-6 py-16 lg:px-14">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="eyebrow">Sign in</div>
          <h1 className="display mt-3 text-4xl">Welcome back</h1>
          <p className="mt-2 text-sm text-muted">Continue to your alumni workspace.</p>

          {error && (
            <div className="mt-6 rounded-lg border border-line bg-paper-2 px-4 py-3 text-sm text-text">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="label">College email</label>
              <input
                type="email" required className="field"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="student@nitjsr.ac.in"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password" required className="field"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn-primary w-full">Sign in</button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">or</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in popup closed or failed.')}
              useOneTap
              theme="outline"
              shape="rectangular"
            />
          </div>

          <p className="mt-8 text-center text-sm text-muted">
            New to AlumniConnect?{' '}
            <Link to="/register" className="font-semibold text-ink underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
