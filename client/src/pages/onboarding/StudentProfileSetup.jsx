import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Trash2, Save, Loader2, Check, X, FileText, UploadCloud, ExternalLink } from 'lucide-react';
import EmailVerificationTag from '../../components/EmailVerificationTag';

const FILE_BASE = (axiosInstance.defaults.baseURL || '').replace(/\/api\/?$/, '');

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

const StudentProfileSetup = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const [formData, setFormData] = useState({
    university: 'National Institute of Technology Jamshedpur',
    graduationYear: user?.graduationYear || '',
    major: '',
    skills: '',
    githubUrl: '',
    portfolioUrl: '',
    resumeUrl: '',
    projects: [],
  });

  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    setUploadingResume(true);
    try {
      const fd = new FormData();
      fd.append('resume', resumeFile);
      const { data } = await axiosInstance.post('/profiles/student/resume', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((f) => ({ ...f, resumeUrl: data.resumeUrl }));
      setResumeFile(null);
      setMessage('Resume uploaded successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleResumeRemove = async () => {
    try {
      await axiosInstance.delete('/profiles/student/resume');
      setFormData((f) => ({ ...f, resumeUrl: '' }));
    } catch (error) {
      setMessage('Failed to remove resume');
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axiosInstance.get(`/profiles/student/${user._id || user.id}`);
        if (data) {
          setFormData({
            ...data,
            skills: data.skills ? data.skills.join(', ') : '',
            projects: data.projects || [],
          });
        }
      } catch (error) {
        if (error.response?.status !== 404) console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleProjectChange = (index, field, value) => {
    const newProjects = [...formData.projects];
    newProjects[index][field] = value;
    setFormData({ ...formData, projects: newProjects });
  };

  const addProject = () => setFormData({
    ...formData,
    projects: [...formData.projects, { title: '', techStack: '', description: '', link: '' }],
  });

  const removeProject = (index) => setFormData({
    ...formData,
    projects: formData.projects.filter((_, i) => i !== index),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
        projects: formData.projects.map((p) => ({
          ...p,
          techStack: typeof p.techStack === 'string' ? p.techStack.split(',').map((s) => s.trim()).filter(Boolean) : p.techStack,
        })),
      };
      await axiosInstance.put('/profiles/student', payload);
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
        <div className="eyebrow"><span className="h-1 w-1 rounded-full bg-ink" /> Student profile</div>
        <h1 className="display mt-5 text-4xl md:text-5xl">Complete your profile</h1>
        <p className="mt-3 text-sm text-muted">A stronger profile improves your AI job-match rate and visibility to alumni.</p>
      </header>

      {/* Identity card */}
      <div className="animate-fade-up mt-8 card p-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-ink text-3xl font-bold uppercase text-paper">
            {user?.firstName?.[0] || ''}
          </div>
          <div className="grid w-full flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
            <DetailRow label="Full name">{user?.firstName || 'Update'} {user?.lastName || 'needed'}</DetailRow>
            <DetailRow label="Username">@{user?.username || 'unknown'}</DetailRow>
            <DetailRow label="Official email">{user?.email}</DetailRow>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Email verification</p>
              <EmailVerificationTag />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="animate-fade-up mt-6 card space-y-10 p-8">
        {/* Academic */}
        <section>
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Academic information</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="label">University</label>
              <input type="text" name="university" required className="field" value={formData.university} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Graduation year</label>
              <input type="number" name="graduationYear" required className="field" value={formData.graduationYear} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Major / degree</label>
              <input type="text" name="major" required className="field" value={formData.major} onChange={handleChange} />
            </div>
          </div>
        </section>

        {/* Technical */}
        <section className="border-t border-line pt-8">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Technical profile</h2>
          <div className="space-y-5">
            <div>
              <label className="label">Top skills (comma separated)</label>
              <input type="text" name="skills" placeholder="React, Node.js, Python" className="field" value={formData.skills} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="label">GitHub URL</label>
                <input type="url" name="githubUrl" className="field" value={formData.githubUrl} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Portfolio URL</label>
                <input type="url" name="portfolioUrl" className="field" value={formData.portfolioUrl} onChange={handleChange} />
              </div>
            </div>
          </div>
        </section>

        {/* Resume */}
        <section className="border-t border-line pt-8">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Resume</h2>

          {formData.resumeUrl ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-paper-2 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-paper text-ink">
                  <FileText size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">Resume on file</p>
                  <a href={`${FILE_BASE}${formData.resumeUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted underline underline-offset-2 hover:text-ink">
                    View PDF <ExternalLink size={11} />
                  </a>
                </div>
              </div>
              <div className="flex gap-2">
                <label className="btn-secondary cursor-pointer py-2">
                  <UploadCloud size={15} /> Replace
                  <input type="file" accept=".pdf" className="hidden" onChange={(e) => setResumeFile(e.target.files[0] || null)} />
                </label>
                <button type="button" onClick={handleResumeRemove} className="btn-ghost py-2">Remove</button>
              </div>
            </div>
          ) : (
            <label className="block cursor-pointer rounded-xl border border-dashed border-line-strong bg-paper-2 p-8 text-center transition-colors hover:border-ink">
              <UploadCloud className="mx-auto mb-2 text-muted" size={28} strokeWidth={1.5} />
              <span className="text-sm font-semibold text-ink underline underline-offset-4">Browse for a PDF</span>
              <input type="file" accept=".pdf" className="hidden" onChange={(e) => setResumeFile(e.target.files[0] || null)} />
              <p className="mt-1 text-xs text-muted">PDF up to 5 MB</p>
            </label>
          )}

          {resumeFile && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-card px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-text"><FileText size={14} /> {resumeFile.name}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setResumeFile(null)} className="btn-ghost py-1.5 text-xs">Cancel</button>
                <button type="button" onClick={handleResumeUpload} disabled={uploadingResume} className="btn-primary py-1.5 text-xs">
                  {uploadingResume ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />} Upload
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Projects */}
        <section className="border-t border-line pt-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Projects portfolio</h2>
            <button type="button" onClick={addProject} className="btn-ghost px-3 py-1.5 text-xs">
              <Plus size={14} /> Add project
            </button>
          </div>

          {formData.projects.length === 0 && (
            <p className="font-serif text-sm italic text-muted">Add projects to improve your AI job-match rate.</p>
          )}

          <div className="space-y-4">
            {formData.projects.map((project, index) => (
              <div key={index} className="relative rounded-xl border border-line bg-paper-2 p-5">
                <button type="button" onClick={() => removeProject(index)} className="absolute right-4 top-4 text-muted transition-colors hover:text-ink">
                  <Trash2 size={16} />
                </button>
                <div className="grid grid-cols-1 gap-4 pr-8 md:grid-cols-2">
                  <div>
                    <label className="label">Project title</label>
                    <input type="text" className="field" value={project.title} onChange={(e) => handleProjectChange(index, 'title', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Tech stack (comma separated)</label>
                    <input type="text" className="field" value={project.techStack} onChange={(e) => handleProjectChange(index, 'techStack', e.target.value)} />
                  </div>
                </div>
                <div className="mt-4 pr-8">
                  <label className="label">Live link / repo</label>
                  <input type="url" className="field" value={project.link} onChange={(e) => handleProjectChange(index, 'link', e.target.value)} />
                </div>
                <div className="mt-4 pr-8">
                  <label className="label">Description</label>
                  <textarea className="field h-20 resize-none" value={project.description} onChange={(e) => handleProjectChange(index, 'description', e.target.value)} />
                </div>
              </div>
            ))}
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

export default StudentProfileSetup;
