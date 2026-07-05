import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import {
  Sparkles, Loader2, Target, Award, BookOpen, Lightbulb, Milestone, ExternalLink,
} from 'lucide-react';

const searchUrl = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
const normSkill = (s) => (typeof s === 'string' ? { skill: s, priority: 'Medium' } : s);
const normCert = (c) => (typeof c === 'string' ? { name: c } : c);
const priorityRank = { High: 0, Medium: 1, Low: 2 };

const PriorityBadge = ({ priority }) => {
  if (priority === 'High') return <span className="inline-flex items-center rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-paper">High</span>;
  return <span className="badge">{priority || 'Medium'}</span>;
};

const SectionHead = ({ icon: Icon, title, hint }) => (
  <div className="mb-5 flex items-baseline justify-between border-t border-line pt-8">
    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted">
      <Icon size={15} /> {title}
    </h2>
    {hint && <span className="font-serif text-sm text-muted/60">{hint}</span>}
  </div>
);

const CareerGuidancePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [form, setForm] = useState({ targetRole: '', targetCompany: '' });

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const { data } = await axiosInstance.get('/career-guidance/roadmap/me');
        setRoadmap(data);
        setForm({ targetRole: data.targetRole || '', targetCompany: data.targetCompany || '' });
      } catch (err) {
        if (err.response?.status !== 404) console.error('Failed to load roadmap:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, []);

  // Students only
  if (user && user.role !== 'Student') return <Navigate to="/dashboard" replace />;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.targetRole.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const { data } = await axiosInstance.post('/career-guidance/roadmap', {
        targetRole: form.targetRole.trim(),
        targetCompany: form.targetCompany.trim(),
      });
      setRoadmap(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate your career plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-ink" size={32} /></div>;

  const skills = (roadmap?.skillsToAcquire || []).map(normSkill)
    .sort((a, b) => (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1));
  const certifications = (roadmap?.certifications || []).map(normCert);
  const resources = roadmap?.learningResources || [];
  const projects = roadmap?.projectSuggestions || [];
  const timeline = roadmap?.timeline || [];

  return (
    <div className="shell max-w-4xl py-14">
      <header className="animate-fade-up border-b border-line pb-8">
        <div className="eyebrow"><Sparkles size={13} /> AI · Career guidance</div>
        <h1 className="display mt-5 text-5xl md:text-6xl">Career guidance</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          Tell us where you want to go. We’ll map the skills, certifications, resources, projects,
          and a month-by-month plan to get you there — personalized to your current profile.
        </p>
      </header>

      {/* Input */}
      <form onSubmit={handleGenerate} className="animate-fade-up mt-8 card p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label">Target role <span className="text-muted">(required)</span></label>
            <input type="text" required className="field" placeholder="e.g. Backend Engineer, Data Scientist"
              value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} />
          </div>
          <div>
            <label className="label">Target company <span className="text-muted">(optional)</span></label>
            <input type="text" className="field" placeholder="e.g. Google, Stripe"
              value={form.targetCompany} onChange={(e) => setForm({ ...form, targetCompany: e.target.value })} />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-xs text-muted">Recommendations use the skills on your profile.</p>
          <button type="submit" disabled={generating || !form.targetRole.trim()} className="btn-primary disabled:opacity-40">
            {generating ? <><Loader2 size={16} className="animate-spin" /> Building your plan…</> : <><Sparkles size={15} /> {roadmap ? 'Regenerate plan' : 'Generate my plan'}</>}
          </button>
        </div>
        {error && <div className="mt-4 rounded-lg border border-line bg-paper-2 px-4 py-3 text-sm text-text">{error}</div>}
      </form>

      {/* Generating skeleton */}
      {generating && !roadmap && (
        <div className="mt-6 card h-72 animate-pulse" />
      )}

      {/* Results */}
      {roadmap && (
        <div className="animate-fade-up mt-6 card p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge"><Target size={12} /> {roadmap.targetRole}</span>
            {roadmap.targetCompany && <span className="badge">{roadmap.targetCompany}</span>}
          </div>

          {roadmap.summary && (
            <p className="mt-5 font-serif text-lg leading-relaxed text-ink">{roadmap.summary}</p>
          )}

          {/* Skills to acquire */}
          {skills.length > 0 && (
            <>
              <SectionHead icon={Target} title="Skills to acquire" hint={`${skills.length} skills`} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {skills.map((s, i) => (
                  <div key={i} className="rounded-xl border border-line bg-paper-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink">{s.skill}</span>
                      <PriorityBadge priority={s.priority} />
                    </div>
                    {s.reason && <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.reason}</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <>
              <SectionHead icon={Award} title="Certifications" />
              <div className="space-y-2">
                {certifications.map((c, i) => (
                  <a key={i} href={searchUrl(`${c.name} ${c.provider || ''}`)} target="_blank" rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-lg border border-line bg-card px-4 py-3 transition-colors hover:border-line-strong">
                    <div>
                      <p className="text-sm font-medium text-ink">{c.name}</p>
                      {c.provider && <p className="text-xs text-muted">{c.provider}</p>}
                    </div>
                    <ExternalLink size={15} className="text-muted transition-colors group-hover:text-ink" />
                  </a>
                ))}
              </div>
            </>
          )}

          {/* Learning resources */}
          {resources.length > 0 && (
            <>
              <SectionHead icon={BookOpen} title="Learning resources" />
              <div className="space-y-2">
                {resources.map((r, i) => (
                  <a key={i} href={searchUrl(`${r.title} ${r.provider || ''}`)} target="_blank" rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 rounded-lg border border-line bg-card px-4 py-3 transition-colors hover:border-line-strong">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{r.title}</p>
                      {r.provider && <p className="truncate text-xs text-muted">{r.provider}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {r.type && <span className="badge">{r.type}</span>}
                      <ExternalLink size={15} className="text-muted transition-colors group-hover:text-ink" />
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}

          {/* Project suggestions */}
          {projects.length > 0 && (
            <>
              <SectionHead icon={Lightbulb} title="Project suggestions" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {projects.map((p, i) => (
                  <div key={i} className="flex flex-col rounded-xl border border-line bg-paper-2 p-5">
                    <h3 className="font-semibold text-ink">{p.title}</h3>
                    {p.description && <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{p.description}</p>}
                    {p.skills?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.skills.map((sk, j) => <span key={j} className="badge">{sk}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <>
              <SectionHead icon={Milestone} title="Personalized roadmap" />
              <ol className="relative ml-3 border-l border-line">
                {timeline.map((phase, i) => (
                  <li key={i} className="relative pb-8 pl-8 last:pb-0">
                    <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-paper bg-ink" />
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <span className="font-serif text-lg text-ink">{phase.phase}</span>
                      {phase.focus && <span className="text-sm font-medium text-muted">{phase.focus}</span>}
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {(phase.actionItems || []).map((item, j) => (
                        <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-text">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </>
          )}

          <p className="mt-8 border-t border-line pt-5 text-xs text-muted">
            Generated by AI — verify certifications and resources before relying on them. Links open a web search.
          </p>
        </div>
      )}
    </div>
  );
};

export default CareerGuidancePage;
