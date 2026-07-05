import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { Save, Loader2, Check, X, Trophy } from 'lucide-react';
import EmailVerificationTag from '../../components/EmailVerificationTag';

const Toast = ({ message }) => {
  const ok = message.includes('success');
  return (
    <div className="animate-fade-up card fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 px-5 py-3 text-sm font-medium text-ink shadow-lg">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-paper">
        {ok ? <Check size={12} /> : <X size={12} />}
      </span>
      {message}
    </div>
  );
};

const DetailRow = ({ label, children }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
    <p className="mt-1 font-medium text-ink">{children}</p>
  </div>
);

const tierFor = (p) => (p >= 200 ? 'Diamond' : p >= 100 ? 'Gold' : p >= 50 ? 'Silver' : p >= 1 ? 'Bronze' : 'Newcomer');

const AlumniProfileSetup = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [contribution, setContribution] = useState(0);

  const [formData, setFormData] = useState({
    college: 'National Institute of Technology Jamshedpur',
    graduationYear: user?.graduationYear || '',
    department: '',
    currentCompany: '',
    jobTitle: '',
    industry: '',
    yearsOfExperience: '',
    skills: '',
    linkedinUrl: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axiosInstance.get(`/profiles/alumni/${user._id || user.id}`);
        if (data) {
          setFormData({
            college: data.college || 'National Institute of Technology Jamshedpur',
            graduationYear: data.graduationYear || user?.graduationYear || '',
            department: data.department || '',
            currentCompany: data.currentCompany || '',
            jobTitle: data.jobTitle || '',
            industry: data.industry || '',
            yearsOfExperience: data.yearsOfExperience || '',
            skills: data.skills ? data.skills.join(', ') : '',
            linkedinUrl: data.linkedinUrl || '',
          });
          setContribution(data.contributionPoints || 0);
        }
      } catch (error) {
        if (error.response?.status !== 404) console.error('Error fetching alumni profile:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
      };
      await axiosInstance.put('/profiles/alumni', payload);
      setMessage('Profile saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-ink" size={32} /></div>;

  return (
    <div className="shell max-w-4xl py-14">
      {message && <Toast message={message} />}

      <header className="animate-fade-up border-b border-line pb-8">
        <div className="eyebrow"><span className="h-1 w-1 rounded-full bg-ink" /> Alumni profile</div>
        <h1 className="display mt-5 text-4xl md:text-5xl">Your professional profile</h1>
        <p className="mt-3 text-sm text-muted">Help students discover you and understand how you can mentor or refer them.</p>
      </header>

      {/* Identity card */}
      <div className="animate-fade-up mt-8 card p-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-ink text-2xl font-bold uppercase text-paper">
            {user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}
          </div>
          <div className="grid w-full flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
            <DetailRow label="Full name">{user?.firstName || 'Update'} {user?.lastName || 'needed'}</DetailRow>
            <DetailRow label="Username">@{user?.username || 'unknown'}</DetailRow>
            <DetailRow label="Official email">{user?.email}</DetailRow>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Email verification</p>
              <EmailVerificationTag />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Contribution</p>
              <span className="badge-gold mt-1"><Trophy size={12} /> {contribution} pts · {tierFor(contribution)}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="animate-fade-up mt-6 card space-y-10 p-8">
        {/* Education */}
        <section>
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Education</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">College / university</label>
              <input type="text" name="college" required className="field" value={formData.college} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Graduation year</label>
              <input type="number" name="graduationYear" required className="field" value={formData.graduationYear} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Department / major</label>
              <input type="text" name="department" required placeholder="e.g. Computer Science" className="field" value={formData.department} onChange={handleChange} />
            </div>
          </div>
        </section>

        {/* Current role */}
        <section className="border-t border-line pt-8">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Current role</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="label">Company</label>
              <input type="text" name="currentCompany" required className="field" value={formData.currentCompany} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Job title</label>
              <input type="text" name="jobTitle" required className="field" value={formData.jobTitle} onChange={handleChange} />
            </div>
          </div>
        </section>

        {/* Industry */}
        <section className="border-t border-line pt-8">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Industry &amp; experience</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="label">Industry</label>
              <input type="text" name="industry" placeholder="e.g. Software, Finance" className="field" value={formData.industry} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Years of experience</label>
              <input type="number" name="yearsOfExperience" min="0" className="field" value={formData.yearsOfExperience} onChange={handleChange} />
            </div>
          </div>
          <div className="mt-5">
            <label className="label">Skills / expertise (comma separated)</label>
            <input type="text" name="skills" placeholder="e.g. System Design, React, Hiring, Mentorship" className="field" value={formData.skills} onChange={handleChange} />
            <p className="mt-1.5 text-xs text-muted">Helps students find you and improves how you’re ranked in the directory.</p>
          </div>
        </section>

        {/* Networking */}
        <section className="border-t border-line pt-8">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Networking</h2>
          <div>
            <label className="label">LinkedIn URL</label>
            <input type="url" name="linkedinUrl" className="field" value={formData.linkedinUrl} onChange={handleChange} />
          </div>
        </section>

        <div className="flex justify-end border-t border-line pt-6">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default AlumniProfileSetup;
