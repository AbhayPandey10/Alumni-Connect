import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { ShieldCheck, Users, Briefcase } from 'lucide-react';
import NetworkMotif from '../../components/NetworkMotif';

const SignupPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [error, setError] = useState('');

  const { register, googleLogin } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(firstName, lastName, username, email, password, Number(graduationYear));
    } catch (err) {
      setError(err);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!graduationYear || !username) {
      setError('Please enter a username and graduation year above before continuing with Google.');
      return;
    }
    try {
      setError('');
      await googleLogin(credentialResponse.credential, Number(graduationYear), username);
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
            Join the network
          </div>
        </div>

        <div className="relative">
          <h2 className="display text-6xl">
            One profile.
            <br />
            A lifetime of
            <br />
            <span className="text-muted">connections.</span>
          </h2>
          <div className="mt-8 space-y-3">
            {[
              { icon: Users, label: 'Discover verified alumni across companies and roles' },
              { icon: Briefcase, label: 'Request referrals and find exclusive opportunities' },
              { icon: ShieldCheck, label: 'Verified through your official college email' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm text-muted">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-paper text-ink">
                  <Icon size={15} strokeWidth={1.8} />
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <span className="badge-verify">
            <ShieldCheck size={13} />
            100% verified members
          </span>
        </div>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-6 py-16 lg:px-14">
        <div className="w-full max-w-md animate-fade-up">
          <div className="eyebrow">Create account</div>
          <h1 className="display mt-3 text-4xl">Join AlumniConnect</h1>
          <p className="mt-2 text-sm text-muted">Set up your verified profile in under a minute.</p>

          {error && (
            <div className="mt-6 rounded-lg border border-line bg-paper-2 px-4 py-3 text-sm text-text">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First name</label>
                <input type="text" required className="field" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="label">Last name</label>
                <input type="text" required className="field" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Username</label>
              <input type="text" required className="field" placeholder="e.g. dev_ninja" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>

            <div>
              <label className="label">Official college email</label>
              <input type="email" required className="field" placeholder="you@college.ac.in" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Graduation year</label>
                <input type="number" required min="1950" max="2030" className="field" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" required className="field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full">Create account</button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">or</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <p className="text-center text-xs text-muted">Enter your username &amp; graduation year above first</p>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in popup closed or failed.')}
              useOneTap
              theme="outline"
              shape="rectangular"
            />
          </div>

          <p className="mt-8 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-ink underline underline-offset-4">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default SignupPage;
