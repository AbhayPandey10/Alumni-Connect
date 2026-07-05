import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import {
  Loader2, ArrowLeft, ShieldCheck, Briefcase, Building2, GraduationCap, Code2, Globe,
  Link2, FileText, ExternalLink, Trophy, Award,
} from 'lucide-react';
import ConnectButton from '../../components/ConnectButton';

const FILE_BASE = (axiosInstance.defaults.baseURL || '').replace(/\/api\/?$/, '');
const tierFor = (p) => (p >= 200 ? 'Diamond' : p >= 100 ? 'Gold' : p >= 50 ? 'Silver' : p >= 1 ? 'Bronze' : 'Newcomer');

const Row = ({ icon: Icon, children }) => (
  <p className="flex items-center gap-2.5 text-sm text-text">
    <Icon size={15} className="shrink-0 text-muted" /> {children}
  </p>
);

const LinkRow = ({ icon: Icon, href, label }) => href ? (
  <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-text hover:text-ink">
    <Icon size={15} className="shrink-0 text-muted" /> <span className="underline underline-offset-2">{label}</span>
    <ExternalLink size={12} className="text-muted" />
  </a>
) : null;

const ProfileViewPage = () => {
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/profiles/view/${userId}`);
        setData(res.data);
      } catch (error) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-ink" size={32} /></div>;
  if (notFound || !data) {
    return (
      <div className="shell py-24 text-center">
        <p className="font-serif text-lg italic text-muted">Profile not found.</p>
        <Link to="/directory" className="btn-secondary mt-5">Back to directory</Link>
      </div>
    );
  }

  const { user, role, profile } = data;
  const name = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.username || 'Member');
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || name[0]?.toUpperCase();
  const isAlumni = role === 'Alumni';

  return (
    <div className="shell max-w-3xl py-14">
      <Link to={isAlumni ? '/directory' : '/dashboard'} className="btn-ghost mb-6 -ml-3">
        <ArrowLeft size={15} /> Back
      </Link>

      {/* Identity */}
      <div className="animate-fade-up card p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-ink text-2xl font-bold uppercase text-paper">
            {initials}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="display text-3xl">{name}</h1>
            <p className="mt-1 text-sm text-muted">@{user.username}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="badge">{role}</span>
              {user.isEmailVerified && <span className="badge-verify"><ShieldCheck size={12} /> Verified</span>}
              {isAlumni && profile?.contributionPoints > 0 && (
                <span className="badge-gold"><Trophy size={12} /> {profile.contributionPoints} pts · {tierFor(profile.contributionPoints)}</span>
              )}
            </div>
          </div>
          <div className="shrink-0">
            <ConnectButton userId={user._id} />
          </div>
        </div>
      </div>

      {!profile ? (
        <div className="card mt-6 py-12 text-center">
          <p className="font-serif text-lg italic text-muted">This member hasn’t completed their profile yet.</p>
        </div>
      ) : isAlumni ? (
        <div className="animate-fade-up mt-6 card space-y-8 p-8">
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Professional</h2>
            <div className="space-y-2.5">
              {profile.jobTitle && profile.currentCompany && <Row icon={Briefcase}>{profile.jobTitle} · <span className="font-medium">{profile.currentCompany}</span></Row>}
              {profile.industry && <Row icon={Building2}>{profile.industry}</Row>}
              {typeof profile.yearsOfExperience === 'number' && <Row icon={Award}>{profile.yearsOfExperience} yrs experience</Row>}
              {profile.department && <Row icon={GraduationCap}>{profile.department}{user.graduationYear ? ` · Class of ${user.graduationYear}` : ''}</Row>}
              <LinkRow icon={Link2} href={profile.linkedinUrl} label="LinkedIn profile" />
            </div>
          </section>

          {profile.skills?.length > 0 && (
            <section className="border-t border-line pt-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Skills</h2>
              <div className="flex flex-wrap gap-1.5">{profile.skills.map((s, i) => <span key={i} className="badge">{s}</span>)}</div>
            </section>
          )}
        </div>
      ) : (
        <div className="animate-fade-up mt-6 card space-y-8 p-8">
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Academic</h2>
            <div className="space-y-2.5">
              {profile.major && <Row icon={GraduationCap}>{profile.major}{user.graduationYear ? ` · Class of ${user.graduationYear}` : ''}</Row>}
              {profile.university && <Row icon={Building2}>{profile.university}</Row>}
              <LinkRow icon={Code2} href={profile.githubUrl} label="GitHub" />
              <LinkRow icon={Globe} href={profile.portfolioUrl} label="Portfolio" />
              <LinkRow icon={FileText} href={profile.resumeUrl ? `${FILE_BASE}${profile.resumeUrl}` : null} label="View resume" />
            </div>
          </section>

          {profile.skills?.length > 0 && (
            <section className="border-t border-line pt-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Skills</h2>
              <div className="flex flex-wrap gap-1.5">{profile.skills.map((s, i) => <span key={i} className="badge">{s}</span>)}</div>
            </section>
          )}

          {profile.projects?.length > 0 && (
            <section className="border-t border-line pt-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Projects</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {profile.projects.map((p, i) => (
                  <div key={i} className="rounded-xl border border-line bg-paper-2 p-4">
                    <h3 className="font-semibold text-ink">{p.title}</h3>
                    {p.description && <p className="mt-1 text-sm leading-relaxed text-muted">{p.description}</p>}
                    {(Array.isArray(p.techStack) ? p.techStack : []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">{p.techStack.map((t, j) => <span key={j} className="badge">{t}</span>)}</div>
                    )}
                    {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-ink underline underline-offset-2">Link <ExternalLink size={11} /></a>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileViewPage;
