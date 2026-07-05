import { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { UploadCloud, Loader2, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

const ResumeAnalyzerPage = () => {
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a PDF resume.');
      return;
    }
    setLoading(true);
    setError('');
    setResults(null);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('targetRole', targetRole);

    try {
      const { data } = await axiosInstance.post('/resume/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to analyze resume. Make sure it is a valid PDF.');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s) => (s >= 80 ? 'var(--color-verify)' : s >= 60 ? 'var(--color-gold)' : 'var(--color-ink)');

  return (
    <div className="shell max-w-4xl py-14">
      <header className="animate-fade-up border-b border-line pb-8">
        <div className="eyebrow"><span className="h-1 w-1 rounded-full bg-ink" /> AI · Resume analysis</div>
        <h1 className="display mt-5 text-4xl md:text-5xl">Resume analyzer</h1>
        <p className="mt-3 max-w-lg text-sm text-muted">Upload your resume for an instant ATS score and tailored, role-specific feedback.</p>
      </header>

      <form onSubmit={handleAnalyze} className="animate-fade-up mt-8 card space-y-6 p-8">
        <div>
          <label className="label">Target job role</label>
          <input type="text" required className="field" placeholder="e.g. Frontend Developer, Data Analyst" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
        </div>

        <label className="block cursor-pointer rounded-xl border border-dashed border-line-strong bg-paper-2 p-10 text-center transition-colors hover:border-ink">
          <UploadCloud className="mx-auto mb-3 text-muted" size={34} strokeWidth={1.5} />
          <span className="font-semibold text-ink underline underline-offset-4">Browse for a PDF</span>
          <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted">
            {file ? <><FileText size={14} /> {file.name}</> : 'or drag and drop your resume here'}
          </p>
        </label>

        {error && <div className="rounded-lg border border-line bg-paper-2 px-4 py-3 text-sm text-text">{error}</div>}

        <button type="submit" disabled={loading || !file || !targetRole} className="btn-primary w-full disabled:opacity-40">
          {loading ? <><Loader2 className="animate-spin" size={18} /> Analyzing…</> : 'Analyze resume'}
        </button>
      </form>

      {results && (
        <div className="animate-fade-up mt-6 card p-8">
          <div className="flex items-end justify-between border-b border-line pb-6">
            <div>
              <div className="eyebrow">ATS score</div>
              <h2 className="display mt-2 text-2xl">Analysis results</h2>
            </div>
            <div className="text-right">
              <span className="font-serif text-6xl font-medium tabular-nums" style={{ color: scoreColor(results.atsScore) }}>
                {results.atsScore}
              </span>
              <span className="font-serif text-2xl text-muted">/100</span>
            </div>
          </div>

          <div className="mt-8 space-y-8">
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted">
                <AlertTriangle size={15} /> Missing keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {results.keywordOptimization?.map((keyword, i) => (
                  <span key={i} className="badge">{keyword}</span>
                ))}
              </div>
            </section>

            <section className="border-t border-line pt-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-muted">Skill gap analysis</h3>
              <p className="rounded-lg border border-line bg-paper-2 p-4 text-sm leading-relaxed text-text">{results.skillGapAnalysis}</p>
            </section>

            <section className="border-t border-line pt-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted">
                <CheckCircle2 size={15} /> Actionable improvements
              </h3>
              <ul className="space-y-3">
                {results.improvementSuggestions?.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-text">
                    <span className="font-serif text-muted tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzerPage;
