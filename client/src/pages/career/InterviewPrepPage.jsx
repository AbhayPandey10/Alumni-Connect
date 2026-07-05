import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { MessageSquareText, Loader2, Target, Lightbulb, ChevronDown } from 'lucide-react';

const LEVELS = ['Internship', 'Entry-level', 'Mid-level'];

const DifficultyBadge = ({ level }) => {
  if (level === 'Hard') return <span className="inline-flex items-center rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-paper">Hard</span>;
  return <span className="badge">{level || 'Medium'}</span>;
};

const InterviewPrepPage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ targetRole: '', targetCompany: '', experienceLevel: 'Entry-level' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prep, setPrep] = useState(null);

  // Students only
  if (user && user.role !== 'Student') return <Navigate to="/dashboard" replace />;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.targetRole.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosInstance.post('/career-guidance/interview-prep', {
        targetRole: form.targetRole.trim(),
        targetCompany: form.targetCompany.trim(),
        experienceLevel: form.experienceLevel,
      });
      setPrep(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate interview prep. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell max-w-4xl py-14">
      <header className="animate-fade-up border-b border-line pb-8">
        <div className="eyebrow"><MessageSquareText size={13} /> AI · Interview prep</div>
        <h1 className="display mt-5 text-5xl md:text-6xl">Interview preparation</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          Get likely interview questions by round — tailored to your target role, company, and profile
          skills — with what each interviewer is looking for.
        </p>
      </header>

      {/* Input */}
      <form onSubmit={handleGenerate} className="animate-fade-up mt-8 card p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="label">Target role <span className="text-muted">(required)</span></label>
            <input type="text" required className="field" placeholder="e.g. Backend Engineer" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} />
          </div>
          <div>
            <label className="label">Target company <span className="text-muted">(optional)</span></label>
            <input type="text" className="field" placeholder="e.g. Google" value={form.targetCompany} onChange={(e) => setForm({ ...form, targetCompany: e.target.value })} />
          </div>
          <div>
            <label className="label">Experience level</label>
            <select className="field" value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-xs text-muted">Questions use the skills on your profile.</p>
          <button type="submit" disabled={loading || !form.targetRole.trim()} className="btn-primary disabled:opacity-40">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Preparing…</> : <><MessageSquareText size={15} /> {prep ? 'Regenerate' : 'Generate questions'}</>}
          </button>
        </div>
        {error && <div className="mt-4 rounded-lg border border-line bg-paper-2 px-4 py-3 text-sm text-text">{error}</div>}
      </form>

      {loading && !prep && <div className="mt-6 card h-72 animate-pulse" />}

      {/* Results */}
      {prep && (
        <div className="animate-fade-up mt-6 space-y-6">
          {prep.overview && (
            <div className="card p-6">
              <div className="flex items-center gap-2">
                <span className="badge"><Target size={12} /> {form.targetRole}</span>
                {form.targetCompany && <span className="badge">{form.targetCompany}</span>}
                <span className="badge">{form.experienceLevel}</span>
              </div>
              <p className="mt-4 font-serif text-lg leading-relaxed text-ink">{prep.overview}</p>
            </div>
          )}

          {(prep.rounds || []).map((round, i) => (
            <div key={i} className="card p-6">
              <div className="mb-4 border-b border-line pb-4">
                <h2 className="text-lg font-semibold text-ink">{round.name}</h2>
                {round.focus && <p className="mt-1 text-sm text-muted">{round.focus}</p>}
              </div>
              <div className="space-y-3">
                {(round.questions || []).map((q, j) => (
                  <details key={j} className="group rounded-xl border border-line bg-paper-2 p-4">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                      <span className="text-sm font-medium text-ink">{q.question}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <DifficultyBadge level={q.difficulty} />
                        <ChevronDown size={16} className="text-muted transition-transform group-open:rotate-180" />
                      </span>
                    </summary>
                    {q.tip && <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-muted">{q.tip}</p>}
                  </details>
                ))}
              </div>
            </div>
          ))}

          {prep.tips?.length > 0 && (
            <div className="card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted">
                <Lightbulb size={15} /> Preparation tips
              </h2>
              <ul className="space-y-3">
                {prep.tips.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-text">
                    <span className="font-serif tabular-nums text-muted">{String(i + 1).padStart(2, '0')}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-center text-xs text-muted">Generated by AI — practice out loud and verify technical answers.</p>
        </div>
      )}
    </div>
  );
};

export default InterviewPrepPage;
