import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, ArrowRight, ArrowUpRight, Plus, Search, Users, Briefcase,
  Sparkles, FileText, Compass, Award, GraduationCap, ChevronDown, ArrowDown,
} from 'lucide-react';
import ParticleRing from '../../components/ParticleRing';
import Reveal from '../../components/Reveal';

/* ---------- animated counter ---------- */
const CountUp = ({ to, suffix = '', duration = 1500 }) => {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(eased * to));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      io.disconnect();
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
};

/* ---------- hero floating pieces ---------- */
const FloatingStat = ({ className, value, label, delay }) => (
  <div className={`animate-float absolute ${className}`} style={{ animationDelay: delay }}>
    <div className="card px-4 py-3 shadow-lg">
      <p className="text-xl font-bold tracking-tight text-ink">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  </div>
);

const FloatingAvatar = ({ className, initials, delay, dark }) => (
  <div className={`animate-float absolute ${className}`} style={{ animationDelay: delay }}>
    <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ring-4 ring-paper ${
      dark ? 'bg-ink text-paper' : 'bg-paper-2 text-ink border border-line'
    }`}>
      {initials}
    </div>
  </div>
);

/* ---------- data ---------- */
const FEATURES = [
  { icon: Search, title: 'Find Alumni', desc: 'Search and connect with verified alumni across companies, roles, and industries.' },
  { icon: Briefcase, title: 'Referral Opportunities', desc: 'Access exclusive job and internship referrals shared directly by alumni.' },
  { icon: Sparkles, title: 'AI Career Assistant', desc: 'Get AI-powered resume feedback, skill insights, and personalized guidance.' },
  { icon: FileText, title: 'Resume Builder', desc: 'Create clean, ATS-friendly resumes optimized for top companies.' },
  { icon: Compass, title: 'Career Roadmaps', desc: 'Turn a target role into a month-by-month plan of skills and projects.' },
  { icon: Award, title: 'Alumni Impact', desc: 'Earn recognition for helping students and building a stronger community.' },
];

const STEPS = [
  { n: '01', title: 'Verify with college email', desc: 'Sign up with your official college email. Every member is verified — no impostors, no noise.' },
  { n: '02', title: 'Discover & connect', desc: 'Search alumni by company, role, and industry. Request referrals with an AI-assisted message.' },
  { n: '03', title: 'Grow your career', desc: 'Get resume analysis, a personalized roadmap, and real opportunities from people who’ve been there.' },
];

const FAQS = [
  { q: 'Who can join AlumniConnect?', a: 'Any current student or graduate of a participating college. Access requires a valid official college email address, which keeps the network 100% verified.' },
  { q: 'How does verification work?', a: 'We authenticate every account against its official college email domain during sign-up, so you always know you’re talking to a real member of your community.' },
  { q: 'Is it free for students?', a: 'Yes. Students get full access to the directory, referral board, resume tools, and AI career guidance at no cost.' },
  { q: 'What does the AI assistant do?', a: 'It analyzes your resume for ATS readiness, recommends skills and certifications for your target role, suggests projects, and builds a personalized career roadmap.' },
  { q: 'How do alumni contribute?', a: 'Alumni post opportunities, accept referral requests, and mentor students. Contributions earn recognition on the community leaderboard.' },
];

/* ---------- section building blocks ---------- */
const SectionEyebrow = ({ children }) => (
  <div className="eyebrow"><span className="h-1 w-1 rounded-full bg-ink" />{children}</div>
);

/* ==================================================================== */
const LandingPage = () => {
  const navLinks = [
    { href: '#for-students', label: 'For Students' },
    { href: '#for-alumni', label: 'For Alumni' },
    { href: '#features', label: 'Features' },
    { href: '#ai', label: 'AI Assistant' },
    { href: '#impact', label: 'Impact' },
    { href: '#how', label: 'About' },
  ];

  return (
    <div className="min-h-screen bg-paper">
      {/* ---------------- Nav ---------------- */}
      <nav className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur-md">
        <div className="shell flex h-16 items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-paper">
              <ShieldCheck size={16} strokeWidth={2.2} />
            </span>
            <span className="text-[19px] font-bold tracking-[-0.03em] text-ink">
              Alumni<span className="text-muted">Connect</span>
            </span>
          </a>

          <div className="hidden items-center gap-7 lg:flex">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-muted transition-colors hover:text-ink">
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost">Log in</Link>
            <Link to="/register" className="btn-primary">Join Now</Link>
          </div>
        </div>
      </nav>

      {/* ---------------- Hero ---------------- */}
      <header id="top" className="relative overflow-hidden">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
        <div className="shell relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <SectionEyebrow>Verified alumni network</SectionEyebrow>
            <h1 className="display mt-6 text-6xl sm:text-7xl">
              Your Network.<br />Your Future.<br /><span className="text-muted">Connected.</span>
            </h1>
            <p className="mt-7 max-w-md text-base leading-relaxed text-muted">
              AlumniConnect is your trusted college network to discover alumni, get referrals, and
              accelerate your career with AI-powered guidance.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary">
                Join with College Email <ArrowRight size={16} />
              </Link>
              <a href="#features" className="btn-secondary">
                Explore Opportunities <Plus size={16} />
              </a>
            </div>
            <div className="mt-8 flex items-center gap-2">
              <span className="badge-verify"><ShieldCheck size={13} /> 100% Verified Network</span>
            </div>
          </div>

          {/* Ring installation */}
          <div className="relative mx-auto hidden aspect-square w-full max-w-[520px] lg:block">
            <ParticleRing className="absolute inset-0" />
            <FloatingStat className="left-0 top-[20%]" value="20K+" label="Verified Alumni" delay="0s" />
            <FloatingStat className="-right-2 top-[40%]" value="50+" label="Top Companies" delay="1.4s" />
            <FloatingStat className="bottom-[18%] left-[4%]" value="98%" label="Referral Success" delay="0.7s" />
            <FloatingAvatar className="left-1/2 top-0 -translate-x-1/2" initials="SP" delay="0.2s" dark />
            <FloatingAvatar className="right-2 top-[14%]" initials="RK" delay="1s" />
            <FloatingAvatar className="bottom-[8%] right-[20%]" initials="AM" delay="0.5s" dark />
            <FloatingAvatar className="bottom-0 left-[24%]" initials="NJ" delay="1.3s" />
          </div>
        </div>

        <a href="#stats" className="shell relative hidden items-center gap-2 pb-8 text-xs text-muted lg:flex lg:justify-end">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line">
            <ArrowDown size={14} />
          </span>
          Scroll to explore
        </a>
      </header>

      {/* ---------------- Stats band ---------------- */}
      <section id="stats" className="border-y border-line bg-paper-2">
        <div className="shell grid grid-cols-2 gap-y-8 py-12 md:grid-cols-4">
          {[
            { to: 20, suffix: 'K+', top: 'Verified Network', label: 'Alumni' },
            { to: 500, suffix: '+', top: 'Top Recruiters', label: 'Companies' },
            { to: 10, suffix: 'K+', top: 'Opportunities Shared', label: 'Referrals' },
            { to: 98, suffix: '%', top: 'Success Rate', label: 'Referral Success' },
          ].map((s, i) => (
            <div key={i} className={`px-4 ${i > 0 ? 'md:border-l md:border-line' : ''}`}>
              <p className="text-xs text-muted">{s.top}</p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-ink">
                <CountUp to={s.to} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Trusted companies ---------------- */}
      <section className="bg-ink py-14 text-paper">
        <div className="shell">
          <p className="text-sm text-paper/50">Trusted by students and alumni from</p>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-x-10 gap-y-8">
            {['Google', 'Microsoft', 'amazon', 'Goldman Sachs', 'JPMorgan', 'Adobe'].map((c, i) => (
              <span
                key={c}
                className={`text-2xl text-paper/70 ${i === 3 || i === 4 ? 'font-serif italic' : 'font-semibold tracking-tight'}`}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section id="features" className="scroll-mt-24 py-24">
        <div className="shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <SectionEyebrow>What you get</SectionEyebrow>
            <h2 className="display mt-5 text-5xl">Built for connections that count.</h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              Everything you need to connect, grow, and succeed — all in one verified place.
            </p>
            <a href="#how" className="btn-secondary mt-8">Learn more <ArrowUpRight size={15} /></a>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <article className="card-hover group flex h-full flex-col p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-paper-2 text-ink">
                    <f.icon size={19} strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-5 text-[15px] font-semibold text-ink">{f.title}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{f.desc}</p>
                  <ArrowUpRight size={16} className="mt-4 text-muted transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" />
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section id="how" className="scroll-mt-24 border-y border-line bg-paper-2 py-24">
        <div className="shell">
          <Reveal><SectionEyebrow>How it works</SectionEyebrow></Reveal>
          <Reveal delay={80}>
            <h2 className="display mt-5 max-w-2xl text-5xl">From sign-up to your next opportunity in three steps.</h2>
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 90} className="bg-paper">
                <div className="flex h-full flex-col p-8">
                  <span className="font-serif text-4xl text-muted/50">{s.n}</span>
                  <h3 className="mt-6 text-xl font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Dual audience ---------------- */}
      <section className="py-24">
        <div className="shell grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div id="for-students" className="card scroll-mt-24 flex h-full flex-col p-8 lg:p-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-paper-2 text-ink">
                <GraduationCap size={20} strokeWidth={1.8} />
              </div>
              <h3 className="display mt-6 text-3xl">For Students</h3>
              <ul className="mt-6 space-y-3 text-sm text-text">
                {['Discover and connect with verified alumni', 'Request referrals with AI-drafted messages', 'Analyze your resume for any target role', 'Get a personalized career roadmap'].map((li) => (
                  <li key={li} className="flex items-start gap-3">
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-paper text-[9px]">✓</span>
                    {li}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn-primary mt-8 self-start">Get started <ArrowRight size={15} /></Link>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div id="for-alumni" className="card scroll-mt-24 flex h-full flex-col p-8 lg:p-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-paper-2 text-ink">
                <Users size={20} strokeWidth={1.8} />
              </div>
              <h3 className="display mt-6 text-3xl">For Alumni</h3>
              <ul className="mt-6 space-y-3 text-sm text-text">
                {['Post internships, roles, and referral links', 'Review and accept referral requests', 'Mentor students from your own college', 'Earn recognition on the contribution leaderboard'].map((li) => (
                  <li key={li} className="flex items-start gap-3">
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-paper text-[9px]">✓</span>
                    {li}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn-secondary mt-8 self-start">Give back <ArrowRight size={15} /></Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- AI Assistant ---------------- */}
      <section id="ai" className="scroll-mt-24 py-8 pb-24">
        <div className="shell">
          <Reveal>
            <div className="card overflow-hidden">
              <div className="grid gap-10 p-8 lg:grid-cols-2 lg:p-14">
                <div>
                  <div className="eyebrow" style={{ color: 'var(--color-ink)' }}><Sparkles size={13} /> AI Assistant</div>
                  <h2 className="display mt-5 text-4xl">Career guidance that actually knows your gaps.</h2>
                  <p className="mt-5 text-sm leading-relaxed text-muted">
                    Tell it your target role and company. It reads your profile, then returns the skills to
                    learn, certifications worth earning, projects to build, and a month-by-month plan.
                  </p>
                  <Link to="/register" className="btn-primary mt-8">Try the assistant <ArrowRight size={15} /></Link>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: FileText, t: 'ATS Resume Analysis', d: 'Instant score + missing keywords for your target role.' },
                    { icon: Compass, t: 'Skill & Project Plan', d: 'Prioritized skills and project ideas tied to the role.' },
                    { icon: Sparkles, t: 'AI Referral Writer', d: 'Polished, personalized referral requests in one click.' },
                  ].map((x) => (
                    <div key={x.t} className="flex items-start gap-4 rounded-xl border border-line bg-paper-2 p-5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-ink">
                        <x.icon size={18} strokeWidth={1.8} />
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{x.t}</p>
                        <p className="mt-0.5 text-sm text-muted">{x.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Impact / testimonial ---------------- */}
      <section id="impact" className="scroll-mt-24 bg-ink py-24 text-paper">
        <div className="shell grid gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col justify-between">
              <blockquote className="font-serif text-3xl leading-snug sm:text-4xl">
                “AlumniConnect helped me find the right opportunity through a referral that changed my career.”
              </blockquote>
              <div className="mt-8 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper/10 text-sm font-bold text-paper">AP</span>
                <div>
                  <p className="text-sm font-semibold">Abhay Pandey</p>
                  <p className="text-xs text-paper/50">B.Tech CSE ’20</p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div className="flex h-full flex-col justify-center">
              <div className="grid grid-cols-3 gap-6 border-b border-paper/15 pb-8">
                {[{ to: 5, s: 'K+', l: 'Students Placed' }, { to: 15, s: 'K+', l: 'Referrals Made' }, { to: 30, s: 'K+', l: 'Conversations' }].map((x) => (
                  <div key={x.l}>
                    <p className="text-3xl font-bold tracking-tight"><CountUp to={x.to} suffix={x.s} /></p>
                    <p className="mt-1 text-xs text-paper/50">{x.l}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xs text-sm text-paper/70">Join thousands of students and alumni already connected.</p>
                <Link to="/register" className="btn inline-flex bg-paper text-ink hover:-translate-y-0.5">Join Now</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="py-24">
        <div className="shell grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <Reveal>
            <SectionEyebrow>FAQ</SectionEyebrow>
            <h2 className="display mt-5 text-4xl">Questions, answered.</h2>
            <p className="mt-4 text-sm text-muted">Everything you need to know before you join.</p>
          </Reveal>
          <Reveal delay={80}>
            <div className="border-t border-line">
              {FAQS.map((f) => (
                <details key={f.q} className="group border-b border-line py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                    <span className="text-base font-medium text-ink">{f.q}</span>
                    <ChevronDown size={18} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="scroll-mt-24 pb-24">
        <div className="shell">
          <Reveal>
            <div className="card relative overflow-hidden px-8 py-16 text-center lg:py-20">
              <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
              <div className="relative">
                <h2 className="display mx-auto max-w-2xl text-5xl">Your network is waiting.</h2>
                <p className="mx-auto mt-5 max-w-md text-sm text-muted">
                  Verified with your college email. Free for students. Built to last a career.
                </p>
                <div className="mt-9 flex flex-wrap justify-center gap-3">
                  <Link to="/register" className="btn-primary">Join with College Email <ArrowRight size={16} /></Link>
                  <Link to="/login" className="btn-secondary">Log in</Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="border-t border-line bg-paper-2">
        <div className="shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-paper">
                <ShieldCheck size={16} strokeWidth={2.2} />
              </span>
              <span className="text-[19px] font-bold tracking-[-0.03em] text-ink">
                Alumni<span className="text-muted">Connect</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              A verified college network for referrals, mentorship, and AI-powered career growth.
            </p>
            <span className="badge-verify mt-5"><ShieldCheck size={13} /> 100% Verified</span>
          </div>

          {[
            { h: 'Product', links: ['Find Alumni', 'Opportunities', 'AI Assistant', 'Resume Builder'] },
            { h: 'Company', links: ['About', 'Impact', 'Universities', 'Contact'] },
            { h: 'Legal', links: ['Privacy', 'Terms', 'Verification'] },
          ].map((col) => (
            <div key={col.h}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{col.h}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}><a href="#top" className="text-sm text-muted transition-colors hover:text-ink">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-line">
          <div className="shell flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted sm:flex-row">
            <span>© {new Date().getFullYear()} AlumniConnect. All rights reserved.</span>
            <span>Designed for the connections that count.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
