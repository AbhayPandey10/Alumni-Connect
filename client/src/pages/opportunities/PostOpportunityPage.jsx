import { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PostOpportunityPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company: '', role: '', type: 'Full-Time', eligibility: '',
    requiredSkills: '', deadline: '', applicationLink: '', salary: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        requiredSkills: formData.requiredSkills.split(',').map((s) => s.trim()),
        salary: formData.salary ? Number(formData.salary) : undefined,
      };
      await axiosInstance.post('/opportunities', payload);
      navigate('/jobs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post opportunity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell max-w-3xl py-14">
      <Link to="/jobs" className="btn-ghost mb-6 -ml-3">
        <ArrowLeft size={15} /> Back to board
      </Link>

      <header className="animate-fade-up border-b border-line pb-8">
        <div className="eyebrow"><span className="h-1 w-1 rounded-full bg-ink" /> New posting</div>
        <h1 className="display mt-5 text-4xl md:text-5xl">Post an opportunity</h1>
        <p className="mt-3 text-sm text-muted">Share an internship, full-time role, or referral with current students.</p>
      </header>

      {error && (
        <div className="mt-6 rounded-lg border border-line bg-paper-2 px-4 py-3 text-sm text-text">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="animate-fade-up mt-8 card space-y-6 p-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="label">Company</label>
            <input type="text" required className="field" placeholder="e.g. Google, Microsoft" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
          </div>
          <div>
            <label className="label">Job role</label>
            <input type="text" required className="field" placeholder="e.g. Frontend Developer" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="label">Opportunity type</label>
            <select className="field" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
              <option value="Full-Time">Full-Time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
          <div>
            <label className="label">Eligibility</label>
            <input type="text" required className="field" placeholder="e.g. 2025 batch, CGPA > 8.0" value={formData.eligibility} onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-[2fr_1fr]">
          <div>
            <label className="label">Required skills (comma separated)</label>
            <input type="text" required className="field" placeholder="React, Node.js, System Design" value={formData.requiredSkills} onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })} />
          </div>
          <div>
            <label className="label">Annual CTC in LPA <span className="text-muted">(optional)</span></label>
            <input type="number" min="0" step="0.5" className="field" placeholder="e.g. 12" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="label">Application deadline</label>
            <input type="date" required className="field" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
          </div>
          <div>
            <label className="label">Official application link</label>
            <input type="url" required className="field" placeholder="https://careers.company.com/job" value={formData.applicationLink} onChange={(e) => setFormData({ ...formData, applicationLink: e.target.value })} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? 'Posting…' : 'Post opportunity'}
        </button>
      </form>
    </div>
  );
};

export default PostOpportunityPage;
