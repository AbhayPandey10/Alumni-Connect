import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Building2, Calendar, Edit3, MessageSquare, Loader2, Sparkles, X, Check, Plus,
  Search, SlidersHorizontal, ExternalLink, Briefcase, TrendingUp, Percent, Star, Copy,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';

const EMPTY_FILTERS = { search: '', company: '', role: '', type: '', eligibility: '', skills: '' };

const MESSAGE_TYPES = [
  { value: 'referral', label: 'Referral request' },
  { value: 'connection', label: 'Connection' },
  { value: 'followup', label: 'Follow-up' },
];

const MESSAGE_HINTS = {
  referral: 'A concise, professional request for a referral to this role.',
  connection: 'A short intro note to connect first — ideal for LinkedIn. No ask yet.',
  followup: 'A polite nudge if you’ve reached out before and haven’t heard back.',
};

/* Opportunity card */
const OpportunityCard = ({ opp, user, onOpenModal, navigate, match, highlight }) => {
  const hasRequested = opp.requestedBy?.includes(user._id || user.id);
  const isOwner = user?._id === (opp.postedBy?._id || opp.postedBy);
  const matchedSet = new Set((match?.matchedSkills || []).map((s) => s.toLowerCase()));
  const skills = opp.requiredSkills || [];
  const poster = opp.poster;
  const postedByName = opp.postedBy?.firstName
    ? `${opp.postedBy.firstName} ${opp.postedBy.lastName || ''}`.trim()
    : (opp.postedBy?.username || opp.postedBy?.email?.split('@')[0] || 'Alumni');

  return (
    <article className={`card-hover flex h-full flex-col p-6 transition-shadow ${highlight ? 'ring-2 ring-ink ring-offset-2 ring-offset-paper' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold leading-snug text-ink">{opp.role}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <Building2 size={14} />
            <span className="font-medium text-text">{opp.company}</span>
          </div>
        </div>
        <span className="badge shrink-0">{opp.type}</span>
      </div>

      {/* Skill-match meter (recommended cards only) */}
      {match && (
        <div className="mt-4 rounded-lg border border-line bg-paper-2 px-3 py-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-ink">
              {match.matchCount} skill{match.matchCount === 1 ? '' : 's'} match
            </span>
            <span className="font-serif tabular-nums text-muted">{match.matchScore}%</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-ink" style={{ width: `${match.matchScore}%` }} />
          </div>
        </div>
      )}

      <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm text-muted">
        <p><span className="text-text">Eligibility · </span>{opp.eligibility}</p>
        <p className="flex items-center gap-2">
          <Calendar size={14} /> Deadline {new Date(opp.deadline).toLocaleDateString()}
        </p>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {skills.slice(0, 6).map((s, i) => (
            <span
              key={i}
              className={matchedSet.has(s.toLowerCase())
                ? 'inline-flex items-center rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-paper'
                : 'badge'}
            >
              {s}
            </span>
          ))}
          {skills.length > 6 && <span className="badge">+{skills.length - 6}</span>}
        </div>
      )}

      {/* Referrer standing — drives priority order among identical openings */}
      {poster && (
        <div className="mt-4 rounded-lg border border-line bg-paper-2 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Referrer</span>
            {opp.isTopReferral && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-paper">
                <Star size={10} /> Top referral
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium text-ink">{postedByName}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1"><Briefcase size={11} /> {poster.yearsOfExperience} yrs</span>
            <span className="inline-flex items-center gap-1"><TrendingUp size={11} /> {poster.contributionScore} contributions</span>
            {poster.successRate != null && (
              <span className="inline-flex items-center gap-1"><Percent size={11} /> {poster.successRate}% success</span>
            )}
          </div>
          {opp.groupSize > 1 && (
            <p className="mt-1.5 text-[11px] text-muted">
              Also posted by {opp.groupSize - 1} other alumn{opp.groupSize - 1 === 1 ? 'us' : 'i'}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto pt-5">
        {user?.role === 'Student' && (
          hasRequested ? (
            <div className="space-y-2">
              <button disabled className="btn-secondary w-full cursor-default" style={{ color: 'var(--color-verify)' }}>
                <Check size={15} /> Request sent
              </button>
              <button onClick={() => onOpenModal(opp, 'followup')} className="btn-ghost w-full">
                <MessageSquare size={15} /> Draft follow-up
              </button>
            </div>
          ) : (
            <button onClick={() => onOpenModal(opp)} className="btn-primary w-full">
              <MessageSquare size={15} /> Request referral
            </button>
          )
        )}
        {isOwner && (
          <button onClick={() => navigate(`/edit-job/${opp._id}`, { state: { opp } })} className="btn-secondary mt-2 w-full">
            <Edit3 size={15} /> Edit post
          </button>
        )}
        {opp.applicationLink && (
          <a href={opp.applicationLink} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-2 w-full">
            <ExternalLink size={14} /> View original posting
          </a>
        )}
      </div>
    </article>
  );
};

/* Page */
const OpportunityListPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isStudent = user?.role === 'Student';
  const isAlumni = user?.role === 'Alumni';

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [recommended, setRecommended] = useState([]);
  const [hasSkills, setHasSkills] = useState(true);
  const [loadingRec, setLoadingRec] = useState(isStudent);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messageType, setMessageType] = useState('referral');
  const [copied, setCopied] = useState(false);
  const [modalMode, setModalMode] = useState('request'); // 'request' | 'followup'

  const [urlParams] = useSearchParams();
  const highlightJobId = urlParams.get('job');
  const [highlightedId, setHighlightedId] = useState(null);

  const hasActiveQuery = Object.values(filters).some((v) => v.trim() !== '');

  // Keep the latest filters accessible inside the debounced effect
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const debouncedSearch = useDebounce(filters.search, 400);

  const fetchOpportunities = useCallback(async (activeFilters) => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(activeFilters).forEach(([k, v]) => {
        if (v.trim() !== '') params[k] = v.trim();
      });
      const { data } = await axiosInstance.get('/opportunities', { params });
      setOpportunities(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Runs on mount and whenever the debounced search term settles.
  // Uses the latest filters (incl. any applied drawer filters) via the ref.
  useEffect(() => {
    fetchOpportunities(filtersRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, fetchOpportunities]);

  useEffect(() => {
    if (!isStudent) return;
    const fetchRecommended = async () => {
      try {
        const { data } = await axiosInstance.get('/opportunities/recommended');
        setRecommended(data.opportunities || []);
        setHasSkills(data.hasSkills);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoadingRec(false);
      }
    };
    fetchRecommended();
  }, [isStudent]);

  useEffect(() => {
    const clearJobNotifications = async () => {
      try {
        await axiosInstance.put('/notifications/read-type', { type: 'New_Opportunity' });
        window.dispatchEvent(new CustomEvent('clearLocalNotifications', { detail: 'New_Opportunity' }));
      } catch (error) {
        console.error('Failed to clear notifications:', error);
      }
    };
    clearJobNotifications();
  }, []);

  // Deep-link from a notification: scroll to and briefly highlight the posting
  useEffect(() => {
    if (!highlightJobId || loading) return;
    if (!opportunities.some((o) => o._id === highlightJobId)) return;
    const el = document.getElementById(`opp-${highlightJobId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedId(highlightJobId);
    const t = setTimeout(() => setHighlightedId(null), 2800);
    return () => clearTimeout(t);
  }, [highlightJobId, opportunities, loading]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOpportunities(filters);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    fetchOpportunities(EMPTY_FILTERS);
  };

  const setField = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const handleOpenModal = (job, mode = 'request') => {
    setSelectedJob(job);
    setMessage('');
    setMessageType(mode === 'followup' ? 'followup' : 'referral');
    setModalMode(mode);
    setCopied(false);
    setShowModal(true);
  };

  const generateAIReferral = async () => {
    setIsGenerating(true);
    try {
      const posterName = selectedJob.postedBy?.firstName
        ? `${selectedJob.postedBy.firstName} ${selectedJob.postedBy.lastName || ''}`.trim()
        : null;
      const payload = {
        studentDetails: `A student at NIT Jamshedpur (${user.email})`,
        alumniDetails: `An alumnus${posterName ? ` named ${posterName}` : ''} working at ${selectedJob.company}`,
        opportunityDetails: `${selectedJob.role} role at ${selectedJob.company}`,
        messageType,
      };
      const { data } = await axiosInstance.post('/resume/generate-message', payload);
      setMessage(data.generatedMessage);
    } catch (error) {
      console.error('AI Generation Error:', error);
      setMessage('Failed to generate message. Please try again or write your own.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!message.trim()) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  // Mark an opportunity as requested across both lists without a refetch
  const markRequested = (oppId) => {
    const uid = user._id || user.id;
    const add = (list) => list.map((o) =>
      o._id === oppId ? { ...o, requestedBy: [...(o.requestedBy || []), uid] } : o);
    setOpportunities(add);
    setRecommended(add);
  };

  const showRecommended = isStudent && !hasActiveQuery;

  return (
    <div className="shell py-14">
      {/* Header */}
      <header className="animate-fade-up flex flex-col gap-6 border-b border-line pb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow"><span className="h-1 w-1 rounded-full bg-ink" /> Opportunities</div>
          <h1 className="display mt-5 text-5xl md:text-6xl">Referral board</h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
            Internships, full-time roles, and referrals shared by verified alumni.
          </p>
        </div>
        {isAlumni && (
          <Link to="/post-job" className="btn-primary self-start">
            <Plus size={16} /> Post an opportunity
          </Link>
        )}
      </header>

      {/* Search + filters */}
      <form onSubmit={handleSearch} className="animate-fade-up mt-8">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-card p-2 focus-within:border-line-strong">
          <Search size={18} className="ml-2 text-muted" />
          <input
            type="text"
            placeholder="Search by role, company, or skill…"
            className="min-w-[10rem] flex-1 bg-transparent px-1 py-2 text-sm text-text placeholder:text-muted/60 focus:outline-none"
            value={filters.search}
            onChange={(e) => setField('search', e.target.value)}
          />
          <button type="button" onClick={() => setShowFilters(!showFilters)} className={`btn-secondary py-2 ${showFilters ? 'bg-paper-2' : ''}`}>
            <SlidersHorizontal size={15} /> Filters
          </button>
          <button type="submit" className="btn-primary py-2">Search</button>
        </div>

        {showFilters && (
          <div className="animate-fade-up mt-3 rounded-xl border border-line bg-card p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input type="text" placeholder="Company" className="field" value={filters.company} onChange={(e) => setField('company', e.target.value)} />
              <input type="text" placeholder="Role" className="field" value={filters.role} onChange={(e) => setField('role', e.target.value)} />
              <select className="field" value={filters.type} onChange={(e) => setField('type', e.target.value)}>
                <option value="">Any type</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
              </select>
              <input type="text" placeholder="Eligibility (e.g. 2025 batch)" className="field" value={filters.eligibility} onChange={(e) => setField('eligibility', e.target.value)} />
              <input type="text" placeholder="Skills (comma separated)" className="field md:col-span-2" value={filters.skills} onChange={(e) => setField('skills', e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={handleClearFilters} className="btn-ghost">Clear all</button>
              <button type="submit" className="btn-primary">Apply filters</button>
            </div>
          </div>
        )}
      </form>

      {/* Recommended for you */}
      {showRecommended && (
        <section className="mt-12">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted">
              <Sparkles size={14} /> Recommended for you
            </h2>
            {recommended.length > 0 && <span className="font-serif text-sm text-muted/60">by your skills</span>}
          </div>

          {loadingRec ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <div key={i} className="card h-64 animate-pulse" />)}
            </div>
          ) : !hasSkills ? (
            <div className="card flex flex-col items-start gap-3 p-6 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted">
                Add your skills to your profile to get opportunities matched to you.
              </p>
              <Link to="/profile/setup/student" className="btn-secondary shrink-0">Add skills</Link>
            </div>
          ) : recommended.length === 0 ? (
            <div className="card p-6">
              <p className="text-sm text-muted">No matches yet — new roles matching your skills will show up here.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {recommended.map((opp, i) => (
                <div key={opp._id} className="animate-fade-up" style={{ animationDelay: `${i * 45}ms` }}>
                  <OpportunityCard
                    opp={opp} user={user} navigate={navigate}
                    onOpenModal={handleOpenModal}
                    match={{ matchedSkills: opp.matchedSkills, matchCount: opp.matchCount, matchScore: opp.matchScore }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* All / filtered opportunities */}
      <section className="mt-12">
        <div className="mb-1.5 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
            {hasActiveQuery ? 'Search results' : 'All opportunities'}
          </h2>
          {!loading && <span className="font-serif text-sm text-muted/60">{opportunities.length} found</span>}
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <div key={i} className="card h-60 animate-pulse" />)}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="card py-20 text-center">
            <p className="font-serif text-lg italic text-muted">
              {hasActiveQuery ? 'No opportunities match your search.' : 'No opportunities posted yet — check back soon.'}
            </p>
            {hasActiveQuery && (
              <button onClick={handleClearFilters} className="btn-secondary mt-5">Clear search &amp; filters</button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opp, i) => (
              <div key={opp._id} id={`opp-${opp._id}`} className="animate-fade-up scroll-mt-24" style={{ animationDelay: `${i * 40}ms` }}>
                <OpportunityCard opp={opp} user={user} navigate={navigate} onOpenModal={handleOpenModal} highlight={opp._id === highlightedId} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Request modal */}
      {showModal && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="card animate-fade-up relative w-full max-w-lg p-7">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 rounded-md p-1.5 text-muted transition-colors hover:bg-paper-2 hover:text-ink">
              <X size={18} />
            </button>

            <div className="eyebrow">{modalMode === 'followup' ? 'Follow-up message' : 'Referral request'}</div>
            <h2 className="display mt-3 text-2xl">{selectedJob?.role}</h2>
            <p className="mt-1 text-sm text-muted">at {selectedJob?.company}</p>

            <div className="mt-6">
              {/* AI message type */}
              <div className="mb-4">
                <label className="label">Draft type</label>
                <div className="flex flex-wrap gap-1.5">
                  {MESSAGE_TYPES
                    .filter((t) => modalMode !== 'followup' || t.value !== 'referral')
                    .map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setMessageType(t.value)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                          messageType === t.value ? 'bg-ink text-paper' : 'border border-line text-muted hover:text-ink'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                </div>
                <p className="mt-2 text-xs text-muted">{MESSAGE_HINTS[messageType]}</p>
              </div>

              <div className="mb-2 flex items-end justify-between">
                <label className="label mb-0">Your message</label>
                <div className="flex items-center gap-1">
                  {message.trim() && (
                    <button onClick={handleCopyMessage} className="btn-ghost px-3 py-1.5 text-xs">
                      {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                    </button>
                  )}
                  <button onClick={generateAIReferral} disabled={isGenerating} className="btn-ghost px-3 py-1.5 text-xs">
                    {isGenerating ? <><Loader2 size={13} className="animate-spin" /> Drafting…</> : <><Sparkles size={13} /> Auto-draft with AI</>}
                  </button>
                </div>
              </div>
              <textarea
                className="field h-40 resize-none"
                placeholder="Write your message, or use the AI draft as a starting point…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              {modalMode === 'followup' ? (
                <p className="mt-4 rounded-lg border border-line bg-paper-2 px-4 py-3 text-xs text-muted">
                  You’ve already requested this referral. Copy your message and send it to the alumnus directly
                  (e.g. LinkedIn or email).
                </p>
              ) : (
                <button
                  disabled={!message.trim() || isGenerating}
                  className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={async () => {
                    setIsGenerating(true);
                    try {
                      await axiosInstance.post(`/opportunities/${selectedJob._id}/request`, { message });
                      markRequested(selectedJob._id);
                      setShowModal(false);
                    } catch (err) {
                      alert(err.response?.data?.message || 'Failed to send request.');
                    } finally {
                      setIsGenerating(false);
                    }
                  }}
                >
                  Send request
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityListPage;
