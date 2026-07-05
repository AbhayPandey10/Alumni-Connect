import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Briefcase, GraduationCap, Building2, ShieldCheck, Sparkles, Zap, TrendingUp } from 'lucide-react';

// Compact card for the "recommended alumni" strip
const RecommendedCard = ({ alum }) => {
  const u = alum.user || {};
  return (
    <Link to={`/u/${u._id}`} className="card-hover flex h-full flex-col p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-paper-2 text-sm font-bold uppercase text-ink">
          {u.firstName?.[0]}{u.lastName?.[0]}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-ink">{u.firstName} {u.lastName}</h3>
          <p className="truncate text-xs text-muted">
            {alum.jobTitle && alum.currentCompany ? `${alum.jobTitle} · ${alum.currentCompany}` : `@${u.username}`}
          </p>
        </div>
      </div>
      {alum.match?.reasons?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
          {alum.match.reasons.map((r, i) => (
            <span key={i} className="inline-flex items-center rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-paper">{r}</span>
          ))}
        </div>
      )}
      {alum.match?.matchedSkills?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {alum.match.matchedSkills.slice(0, 4).map((s, i) => <span key={i} className="badge">{s}</span>)}
        </div>
      )}
    </Link>
  );
};

const AlumniDirectory = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'Student';
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);

  const [recommended, setRecommended] = useState([]);
  const [hasBasis, setHasBasis] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useState({
    username: '', company: '', role: '', industry: '', department: '', graduationYear: '', skills: '',
  });

  const fetchAlumni = async (currentPage = 1) => {
    setLoading(true);
    try {
      const queryParams = { page: currentPage, limit: 9 };
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value.trim() !== '') queryParams[key] = value.trim();
      });

      const { data } = await axiosInstance.get('/profiles/alumni', { params: queryParams });
      setAlumni(data.alumni);
      setTotalPages(data.totalPages);
      setTotalResults(data.totalResults);
    } catch (error) {
      console.error('Failed to fetch alumni directory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (!isStudent) return;
    const fetchRecommended = async () => {
      try {
        const { data } = await axiosInstance.get('/profiles/alumni/recommended');
        setRecommended(data.alumni || []);
        setHasBasis(data.hasBasis);
      } catch (error) {
        console.error('Failed to fetch recommended alumni:', error);
      }
    };
    fetchRecommended();
  }, [isStudent]);

  const hasActiveQuery = Object.values(searchParams).some((v) => v.trim() !== '');

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAlumni(1);
  };

  const handleClearFilters = () => {
    setSearchParams({ username: '', company: '', role: '', industry: '', department: '', graduationYear: '', skills: '' });
    setPage(1);
    setTimeout(() => fetchAlumni(1), 0);
  };

  return (
    <div className="shell py-14">
      {/* Header */}
      <header className="animate-fade-up border-b border-line pb-10">
        <div className="eyebrow">
          <span className="h-1 w-1 rounded-full bg-ink" />
          Directory
        </div>
        <h1 className="display mt-5 text-5xl md:text-6xl">Alumni directory</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          Search verified alumni by username, company, role, industry, or batch. Results are ranked by
          skill match, referral success, and responsiveness.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="mt-8">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-card p-2 focus-within:border-line-strong">
            <Search size={18} className="ml-2 text-muted" />
            <input
              type="text"
              placeholder="Search by username…"
              className="w-full bg-transparent px-1 py-2 text-sm text-text placeholder:text-muted/60 focus:outline-none"
              value={searchParams.username}
              onChange={(e) => setSearchParams({ ...searchParams, username: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary py-2 ${showFilters ? 'bg-paper-2' : ''}`}
            >
              <SlidersHorizontal size={15} />
              Filters
            </button>
            <button type="submit" className="btn-primary py-2">Search</button>
          </div>

          {showFilters && (
            <div className="animate-fade-up mt-3 rounded-xl border border-line bg-card p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input type="text" placeholder="Company" className="field" value={searchParams.company} onChange={(e) => setSearchParams({ ...searchParams, company: e.target.value })} />
                <input type="text" placeholder="Role" className="field" value={searchParams.role} onChange={(e) => setSearchParams({ ...searchParams, role: e.target.value })} />
                <input type="text" placeholder="Industry" className="field" value={searchParams.industry} onChange={(e) => setSearchParams({ ...searchParams, industry: e.target.value })} />
                <input type="text" placeholder="Department" className="field" value={searchParams.department} onChange={(e) => setSearchParams({ ...searchParams, department: e.target.value })} />
                <input type="number" placeholder="Graduation year" className="field" value={searchParams.graduationYear} onChange={(e) => setSearchParams({ ...searchParams, graduationYear: e.target.value })} />
                <input type="text" placeholder="Skills (comma separated)" className="field md:col-span-2" value={searchParams.skills} onChange={(e) => setSearchParams({ ...searchParams, skills: e.target.value })} />
              </div>
              <p className="mt-3 text-xs text-muted">Leave skills blank to rank by your own profile skills.</p>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={handleClearFilters} className="btn-ghost">Clear all</button>
                <button type="submit" className="btn-primary">Apply filters</button>
              </div>
            </div>
          )}
        </form>
      </header>

      {/* Recommended alumni (students, when not actively searching) */}
      {isStudent && !hasActiveQuery && (recommended.length > 0 || !hasBasis) && (
        <section className="mt-10">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted">
              <Sparkles size={14} /> Recommended for you
            </h2>
            {recommended.length > 0 && <span className="font-serif text-sm text-muted/60">alumni to reach out to</span>}
          </div>

          {!hasBasis ? (
            <div className="card flex flex-col items-start gap-3 p-6 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted">Add skills to your profile (or generate a career roadmap) to get matched with alumni.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map((alum, i) => (
                <div key={alum._id} className="animate-fade-up" style={{ animationDelay: `${i * 45}ms` }}>
                  <RecommendedCard alum={alum} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Results meta */}
      <div className="mt-10 flex items-baseline justify-between">
        <p className="text-sm text-muted">
          {loading ? 'Searching…' : <><span className="font-serif text-lg text-ink">{totalResults}</span> verified alumni</>}
        </p>
        {!loading && <span className="text-sm text-muted">Page {page} of {totalPages}</span>}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-52 animate-pulse" />)}
        </div>
      ) : alumni.length === 0 ? (
        <div className="mt-6 card flex flex-col items-center py-20 text-center">
          <p className="font-serif text-lg italic text-muted">No alumni match your criteria.</p>
          <button onClick={handleClearFilters} className="btn-secondary mt-5">Clear search &amp; filters</button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {alumni.map((alum, i) => (
            <div key={alum._id} className="animate-fade-up" style={{ animationDelay: `${i * 45}ms` }}>
              <Link to={`/u/${alum.user?._id}`} className="card-hover group flex h-full flex-col p-6">
                <div className="flex items-center gap-4 border-b border-line pb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line bg-paper-2 text-sm font-bold uppercase text-ink">
                    {alum.user?.firstName?.[0]}{alum.user?.lastName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-ink">{alum.user?.firstName} {alum.user?.lastName}</h3>
                    <p className="truncate text-xs text-muted">@{alum.user?.username}</p>
                  </div>
                  <ShieldCheck size={16} className="ml-auto shrink-0" style={{ color: 'var(--color-verify)' }} />
                </div>

                <div className="mt-4 space-y-2.5 text-sm text-text">
                  {alum.jobTitle && alum.currentCompany && (
                    <p className="flex items-center gap-2.5">
                      <Briefcase size={15} className="shrink-0 text-muted" />
                      <span>{alum.jobTitle} · <span className="font-medium">{alum.currentCompany}</span></span>
                    </p>
                  )}
                  {alum.department && (
                    <p className="flex items-center gap-2.5">
                      <Building2 size={15} className="shrink-0 text-muted" />{alum.department}
                    </p>
                  )}
                  {alum.user?.graduationYear && (
                    <p className="flex items-center gap-2.5">
                      <GraduationCap size={15} className="shrink-0 text-muted" />Class of {alum.user.graduationYear}
                    </p>
                  )}
                </div>

                {/* Ranking signals */}
                {alum.ranking && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-4 text-[11px] text-muted">
                    {alum.ranking.skillMatch != null && (
                      <span className="inline-flex items-center gap-1"><Sparkles size={11} /> {alum.ranking.skillMatch}% skill match</span>
                    )}
                    <span className="inline-flex items-center gap-1"><Zap size={11} /> {alum.ranking.responsiveness}% responsive</span>
                    {alum.ranking.successRate != null && (
                      <span className="inline-flex items-center gap-1"><TrendingUp size={11} /> {alum.ranking.successRate}% referral success</span>
                    )}
                  </div>
                )}

                {alum.skills?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {alum.skills.slice(0, 6).map((s, i) => (
                      <span
                        key={i}
                        className={alum.ranking?.matchedSkills?.some((m) => m.toLowerCase() === s.toLowerCase())
                          ? 'inline-flex items-center rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-paper'
                          : 'badge'}
                      >
                        {s}
                      </span>
                    ))}
                    {alum.skills.length > 6 && <span className="badge">+{alum.skills.length - 6}</span>}
                  </div>
                )}
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-14 flex items-center justify-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:bg-paper-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-serif text-sm text-muted">{page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:bg-paper-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AlumniDirectory;
