import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Panel, Stat, BarList, TrendBars, Donut } from '../../components/charts';
import {
  BarChart3, Download, Printer, RotateCcw, Sparkles, Loader2,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';

const EMPTY = { company: '', jobType: '', graduationYear: '', department: '', from: '', to: '' };
const lpa = (v) => (v == null ? '—' : `${v} LPA`);

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY);

  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState('');

  const paramsFrom = (f) => {
    const p = {};
    Object.entries(f).forEach(([k, v]) => { if (v !== '') p[k] = v; });
    return p;
  };

  const fetchData = async (f) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/analytics', { params: paramsFrom(f) });
      setData(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(EMPTY); }, []);

  const applyFilters = (e) => { e.preventDefault(); fetchData(filters); };
  const resetFilters = () => { setFilters(EMPTY); fetchData(EMPTY); };
  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  const generateInsights = async () => {
    setInsightsLoading(true);
    setInsightsError('');
    try {
      const { data } = await axiosInstance.get('/analytics/insights', { params: paramsFrom(filters) });
      setInsights(data.insights || []);
    } catch (error) {
      setInsightsError(error.response?.data?.message || 'Failed to generate insights.');
    } finally {
      setInsightsLoading(false);
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = [['Metric', 'Value']];
    Object.entries(data.kpis).forEach(([k, v]) => { if (v != null) rows.push([k, v]); });
    const addTable = (title, arr) => {
      rows.push([]); rows.push([title]);
      (arr || []).forEach((d) => rows.push([d.label, d.value == null ? '' : d.value]));
    };
    addTable('Referral funnel', data.referral.funnel);
    addTable('Referrals by month', data.referral.byMonth);
    addTable('Top referral companies', data.referral.topCompanies);
    addTable('Jobs by type', data.jobs.byType);
    addTable('Placement by department', data.placement.byDepartment);
    addTable('Most demanded skills', data.skills.mostDemanded);
    addTable('Salary by company (avg LPA)', data.salary.byCompany);
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `alumniconnect-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !data) {
    return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-ink" size={32} /></div>;
  }
  if (!data) return null;

  const k = data.kpis;
  const admin = data.isAdmin;
  const kpiCards = [
    ...(admin ? [
      { label: 'Total Students', value: k.totalStudents },
      { label: 'Total Alumni', value: k.totalAlumni },
    ] : []),
    { label: 'Companies', value: k.totalCompanies },
    { label: 'Jobs Posted', value: k.totalJobs, sub: `${k.activeJobs} active` },
    admin
      ? { label: 'Students Placed', value: k.studentsPlaced, sub: `${k.placementRate}% placement rate` }
      : { label: 'Placement Rate', value: `${k.placementRate}%` },
    { label: 'Total Referrals', value: k.totalReferrals },
    { label: 'Successful Referrals', value: k.successfulReferrals, sub: `${k.referralSuccessRate}% success` },
    { label: 'Interviews', value: k.totalInterviews },
    { label: 'Offers', value: k.totalOffers },
    { label: 'Avg Package', value: lpa(k.avgPackage) },
    { label: 'Median Package', value: lpa(k.medianPackage) },
    { label: 'Highest Package', value: lpa(k.highestPackage) },
  ];

  const SentIcon = ({ s }) => (s === 'up' ? <TrendingUp size={15} /> : s === 'down' ? <TrendingDown size={15} /> : <Minus size={15} />);

  return (
    <div className="shell py-14">
      {/* Header */}
      <header className="animate-fade-up border-b border-line pb-8">
        <div className="eyebrow"><BarChart3 size={13} /> Analytics</div>
        <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="display text-5xl md:text-6xl">Placement analytics</h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
              Live KPIs across referrals, jobs, companies, placements, salary, and skills.
            </p>
            {!admin && (
              <p className="mt-3 text-xs text-muted">
                Student &amp; alumni headcounts and rosters are restricted to admins.
              </p>
            )}
          </div>
          <div className="no-print flex flex-wrap gap-2">
            <button onClick={exportCSV} className="btn-secondary"><Download size={15} /> CSV</button>
            <button onClick={() => window.print()} className="btn-secondary"><Printer size={15} /> Print / PDF</button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <form onSubmit={applyFilters} className="no-print animate-fade-up mt-6 card p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input className="field" placeholder="Company" value={filters.company} onChange={(e) => setF('company', e.target.value)} />
          <select className="field" value={filters.jobType} onChange={(e) => setF('jobType', e.target.value)}>
            <option value="">Any job type</option>
            <option>Full-Time</option><option>Internship</option><option>Contract</option><option>Freelance</option>
          </select>
          <input className="field" placeholder="Department" value={filters.department} onChange={(e) => setF('department', e.target.value)} />
          <input type="number" className="field" placeholder="Grad year" value={filters.graduationYear} onChange={(e) => setF('graduationYear', e.target.value)} />
          <input type="date" className="field" value={filters.from} onChange={(e) => setF('from', e.target.value)} />
          <input type="date" className="field" value={filters.to} onChange={(e) => setF('to', e.target.value)} />
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={resetFilters} className="btn-ghost"><RotateCcw size={14} /> Reset</button>
          <button type="submit" className="btn-primary">{loading ? <Loader2 size={15} className="animate-spin" /> : null} Apply filters</button>
        </div>
      </form>

      {/* Overview KPIs */}
      <section className="mt-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Overview</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {kpiCards.map((c) => <Stat key={c.label} {...c} />)}
        </div>
      </section>

      {/* AI Insights */}
      <section className="mt-8">
        <Panel
          title="AI-powered insights"
          subtitle="Generated from the current data and filters"
          right={
            <button onClick={generateInsights} disabled={insightsLoading} className="no-print btn-secondary py-2">
              {insightsLoading ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</> : <><Sparkles size={14} /> Generate</>}
            </button>
          }
        >
          {insightsError && <p className="text-sm text-text">{insightsError}</p>}
          {!insightsError && insights.length === 0 && !insightsLoading && (
            <p className="text-sm text-muted">Click Generate to surface trends and anomalies from your data.</p>
          )}
          {insights.length > 0 && (
            <ul className="space-y-3">
              {insights.map((it, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-paper-2 text-ink">
                    <SentIcon s={it.sentiment} />
                  </span>
                  <span className="text-sm leading-relaxed text-text">{it.text}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      {/* Panels grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Referral analytics */}
        <Panel title="Referral analytics" subtitle="Request → hire funnel" className="lg:col-span-2">
          <div className="grid gap-8 md:grid-cols-2">
            <BarList data={data.referral.funnel} empty="No referrals yet" />
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Response rate" value={`${data.referral.responseRate}%`} />
              <Stat label="Acceptance rate" value={`${data.referral.acceptanceRate}%`} />
              <Stat label="→ Interview" value={`${data.referral.toInterviewRate}%`} />
              <Stat label="→ Offer" value={`${data.referral.toOfferRate}%`} />
            </div>
          </div>
        </Panel>

        <Panel title="Referrals by month"><TrendBars data={data.referral.byMonth} /></Panel>
        <Panel title="Top referral companies"><BarList data={data.referral.topCompanies} empty="No referral companies yet" /></Panel>

        {/* Placement trends */}
        <Panel
          title="Placement trends"
          subtitle={`${data.placement.rate}% placed${admin ? ` · ${data.placement.searching} still searching` : ''}`}
          className="lg:col-span-2"
        >
          <div className={`grid gap-8 ${admin ? 'md:grid-cols-2' : ''}`}>
            <div>
              <p className="mb-3 text-xs font-medium text-muted">Placements by month</p>
              <TrendBars data={data.placement.byMonth} empty="No placements recorded" />
            </div>
            {admin && (
              <div>
                <p className="mb-3 text-xs font-medium text-muted">By department</p>
                <BarList data={data.placement.byDepartment} empty="No placements by department" />
              </div>
            )}
          </div>
        </Panel>

        {/* Job analytics */}
        <Panel title="Jobs by type"><Donut data={data.jobs.byType} empty="No jobs yet" /></Panel>
        <Panel title="Jobs by company"><BarList data={data.jobs.byCompany} empty="No jobs yet" /></Panel>
        <Panel title="Most requested jobs" className="lg:col-span-2"><BarList data={data.jobs.mostRequested} empty="No requests yet" /></Panel>

        {/* Salary analytics */}
        <Panel title="Salary analytics" subtitle={data.salary.count ? `${data.salary.count} roles with salary data` : 'Add CTC when posting to populate this'} className="lg:col-span-2">
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Average" value={lpa(data.salary.avg)} />
            <Stat label="Median" value={lpa(data.salary.median)} />
            <Stat label="Highest" value={lpa(data.salary.highest)} />
            <Stat label="Lowest" value={lpa(data.salary.lowest)} />
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-medium text-muted">Distribution</p>
              <BarList data={data.salary.distribution} empty="No salary data" />
            </div>
            <div>
              <p className="mb-3 text-xs font-medium text-muted">Average by company (LPA)</p>
              <BarList data={data.salary.byCompany} suffix=" LPA" empty="No salary data" />
            </div>
          </div>
        </Panel>

        {/* Skills analytics */}
        <Panel title="Most demanded skills"><BarList data={data.skills.mostDemanded} empty="No job skills yet" /></Panel>
        <Panel title="Skill gap" subtitle="In demand, uncommon among students"><BarList data={data.skills.gap} empty="No gap detected" /></Panel>

        {/* Company analytics (aggregate — public) */}
        <Panel title="Companies — most hires"><BarList data={data.companies.mostHires} empty="No hires yet" /></Panel>
        <Panel title="Companies — most jobs"><BarList data={data.companies.mostJobs} empty="No jobs yet" /></Panel>

        {/* ---- Admin-only: individual student & alumni information ---- */}
        {admin && (
          <>
            <Panel title="Alumni by company"><BarList data={data.alumni.byCompany} empty="No alumni companies yet" /></Panel>
            <Panel title="Alumni by experience"><Donut data={data.alumni.byExperience} empty="No experience data" /></Panel>

            <Panel title="Student activity" subtitle="Admin only" className="lg:col-span-2">
              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                <Stat label="Receiving referrals" value={data.studentActivity.receivingReferrals} />
                <Stat label="Getting interviews" value={data.studentActivity.gettingInterviews} />
                <Stat label="Receiving offers" value={data.studentActivity.receivingOffers} />
                <Stat label="Avg profile complete" value={`${data.studentActivity.avgProfileCompletion}%`} />
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                <div><p className="mb-3 text-xs font-medium text-muted">By department</p><BarList data={data.studentActivity.byDepartment} empty="No department data" /></div>
                <div><p className="mb-3 text-xs font-medium text-muted">By batch</p><BarList data={data.studentActivity.byBatch} empty="No batch data" /></div>
              </div>
            </Panel>

            <Panel title="Leaderboards" subtitle="Admin only" className="lg:col-span-2">
              <div className="grid gap-8 md:grid-cols-3">
                <div><p className="mb-3 text-xs font-medium text-muted">Students — most referrals</p><BarList data={data.leaderboards.studentsMostReferrals} empty="No data" /></div>
                <div><p className="mb-3 text-xs font-medium text-muted">Alumni — best acceptance %</p><BarList data={data.leaderboards.alumniBestAcceptance} suffix="%" empty="No data" /></div>
                <div><p className="mb-3 text-xs font-medium text-muted">Companies — most hires</p><BarList data={data.leaderboards.companiesMostHires} empty="No data" /></div>
              </div>
            </Panel>
          </>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        Generated {new Date(data.generatedAt).toLocaleString()} · placements & offers derived from referral outcomes
      </p>
    </div>
  );
};

export default AnalyticsPage;
