import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { User, Briefcase, Users, FileSearch, FileText, PlusCircle, ShieldCheck, ArrowUpRight, Compass, Inbox, Send, BarChart3, Shield, MessageSquareText, UserPlus } from 'lucide-react';

import LeaderboardWidget from './components/LeaderboardWidget';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import VerifyOtpPage from './pages/auth/VerifyOtpPage';
import StudentProfileSetup from './pages/onboarding/StudentProfileSetup';
import AlumniProfileSetup from './pages/onboarding/AlumniProfileSetup';
import OpportunityListPage from './pages/opportunities/OpportunityListPage';
import PostOpportunityPage from './pages/opportunities/PostOpportunityPage';
import EditOpportunityPage from './pages/opportunities/EditOpportunityPage';
import MyPostingsPage from './pages/opportunities/MyPostingsPage';
import ResumeAnalyzerPage from './pages/resume/ResumeAnalyzerPage';
import ResumeBuilderPage from './pages/resume/ResumeBuilderPage';
import AlumniDirectory from './pages/directory/AlumniDirectory';
import ProfileViewPage from './pages/profile/ProfileViewPage';
import NetworkPage from './pages/connections/NetworkPage';
import CareerGuidancePage from './pages/career/CareerGuidancePage';
import InterviewPrepPage from './pages/career/InterviewPrepPage';
import ReferralInboxPage from './pages/referrals/ReferralInboxPage';
import MyReferralsPage from './pages/referrals/MyReferralsPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import LandingPage from './pages/landing/LandingPage';



//Dashboard
const ActionCard = ({ to, title, description, icon: Icon, cta, index }) => (
  <Link to={to} className="card-hover group flex flex-col p-6">
    <div className="flex items-start justify-between">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-paper-2 text-ink">
        <Icon size={19} strokeWidth={1.8} />
      </div>
      <span className="font-serif text-sm tabular-nums text-muted/60">
        {String(index + 1).padStart(2, '0')}
      </span>
    </div>
    <h3 className="mt-5 text-[15px] font-semibold text-ink">{title}</h3>
    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{description}</p>
    <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink">
      {cta}
      <ArrowUpRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </span>
  </Link>
);

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const isStudent = user?.role === 'Student';
  const displayName = user?.firstName || user?.username || user?.email?.split('@')[0] || 'there';

  const actions = [
    {
      to: isStudent ? '/profile/setup/student' : '/profile/setup/alumni',
      title: 'Your Profile',
      description: 'Keep your details current so the right people can find and connect with you.',
      icon: User, cta: 'Edit profile', show: true,
    },
    {
      to: '/jobs',
      title: 'Opportunities',
      description: isStudent ? 'Browse open roles and request referrals from verified alumni.' : 'Review the roles you and fellow alumni have shared.',
      icon: Briefcase, cta: 'Open board', show: true,
    },
    {
      to: '/directory',
      title: 'Alumni Directory',
      description: 'Search alumni by company, industry, and role to find your next mentor.',
      icon: Users, cta: 'Browse alumni', show: true,
    },
    {
      to: '/connections',
      title: 'My Network',
      description: 'Send and accept connection requests to build your alumni-student network.',
      icon: UserPlus, cta: 'View network', show: true,
    },
    {
      to: '/resume-analyzer',
      title: 'Resume Analysis',
      description: 'Upload a PDF for an instant ATS score and tailored, role-specific feedback.',
      icon: FileSearch, cta: 'Analyze resume', show: isStudent,
    },
    {
      to: '/build-resume',
      title: 'Resume Builder',
      description: 'Compose your details and export a clean, ATS-friendly document.',
      icon: FileText, cta: 'Start building', show: isStudent,
    },
    {
      to: '/career-guidance',
      title: 'Career Guidance',
      description: 'AI skill plans, certifications, resources, and a personalized roadmap for your target role.',
      icon: Compass, cta: 'Get your plan', show: isStudent,
    },
    {
      to: '/interview-prep',
      title: 'Interview Prep',
      description: 'AI-generated interview questions by round, tailored to your target role and skills.',
      icon: MessageSquareText, cta: 'Prepare now', show: isStudent,
    },
    {
      to: '/my-referrals',
      title: 'My Requests',
      description: 'Track the referral requests you’ve sent and their live status.',
      icon: Send, cta: 'Track requests', show: isStudent,
    },
    {
      to: '/post-job',
      title: 'Post an Opportunity',
      description: 'Share an internship, full-time role, or referral with current students.',
      icon: PlusCircle, cta: 'Post a role', show: !isStudent,
    },
    {
      to: '/my-postings',
      title: 'My Postings',
      description: 'View, edit, hide, or remove the opportunities you’ve posted.',
      icon: Briefcase, cta: 'Manage postings', show: !isStudent,
    },
    {
      to: '/referrals',
      title: 'Referral Requests',
      description: 'Review students who requested referrals and track outcomes to build your success rate.',
      icon: Inbox, cta: 'Open inbox', show: !isStudent,
    },
    {
      to: '/analytics',
      title: 'Placement Analytics',
      description: 'KPIs across referrals, jobs, alumni, companies, placements, salary, and skills.',
      icon: BarChart3, cta: 'View analytics', show: true,
    },
    {
      to: '/admin',
      title: 'Admin Dashboard',
      description: 'Manage users, moderate opportunities, and monitor platform activity.',
      icon: Shield, cta: 'Open admin', show: user?.role === 'Admin',
    },
  ].filter((a) => a.show);

  return (
    <div className="shell py-14">
      {/* Editorial header */}
      <header className="animate-fade-up border-b border-line pb-10">
        <div className="eyebrow">
          <span className="h-1 w-1 rounded-full bg-ink" />
          {isStudent ? 'Student workspace' : 'Alumni workspace'}
        </div>
        <div className="mt-5 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <h1 className="display text-5xl md:text-[64px]">
            Welcome back,
            <br />
            <span className="text-muted">{displayName}.</span>
          </h1>
          <div className="max-w-xs md:text-right">
            <div className="badge-verify md:ml-auto">
              <ShieldCheck size={13} />
              Verified · college email
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">{user?.email}</p>
            <span className="badge mt-2">{user?.role || 'Member'}</span>
          </div>
        </div>
      </header>

      {/* Quick actions */}
      <section className="mt-12">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Quick actions</h2>
          <span className="font-serif text-sm text-muted/60">{actions.length} tools</span>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action, i) => (
            <div key={action.to} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <ActionCard {...action} index={i} />
            </div>
          ))}
        </div>
      </section>

      <LeaderboardWidget />
    </div>
  );
};

const Landing = () => {
  const { user } = useContext(AuthContext);
  return user ? <Navigate to="/dashboard" replace /> : <LandingPage />;
};

const AppRoutes = () => {
  return (
    <div className="relative z-10 min-h-screen bg-paper">
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<SignupPage />} />
          <Route path="/verify" element={<VerifyOtpPage />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/profile/setup/student" element={
            <ProtectedRoute>
              <StudentProfileSetup />
            </ProtectedRoute>
          } />
          
          <Route path="/profile/setup/alumni" element={
            <ProtectedRoute>
              <AlumniProfileSetup />
            </ProtectedRoute>
          } />
          
          <Route path="/jobs" element={
            <ProtectedRoute>
              <OpportunityListPage />
            </ProtectedRoute>
          } />
          
          <Route path="/post-job" element={
            <ProtectedRoute>
              <PostOpportunityPage />
            </ProtectedRoute>
          } />
          
          <Route path="/edit-job/:id" element={
            <ProtectedRoute>
              <EditOpportunityPage />
            </ProtectedRoute>
          } />

          <Route path="/my-postings" element={
            <ProtectedRoute>
              <MyPostingsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/resume-analyzer" element={
            <ProtectedRoute>
              <ResumeAnalyzerPage />
            </ProtectedRoute>
          } />
          
          <Route path="/build-resume" element={
            <ProtectedRoute>
              <ResumeBuilderPage />
            </ProtectedRoute>
          } />

          <Route path="/directory" element={
            <ProtectedRoute>
              <AlumniDirectory />
            </ProtectedRoute>
          } />

          <Route path="/u/:userId" element={
            <ProtectedRoute>
              <ProfileViewPage />
            </ProtectedRoute>
          } />

          <Route path="/connections" element={
            <ProtectedRoute>
              <NetworkPage />
            </ProtectedRoute>
          } />

          <Route path="/career-guidance" element={
            <ProtectedRoute>
              <CareerGuidancePage />
            </ProtectedRoute>
          } />

          <Route path="/interview-prep" element={
            <ProtectedRoute>
              <InterviewPrepPage />
            </ProtectedRoute>
          } />

          <Route path="/referrals" element={
            <ProtectedRoute>
              <ReferralInboxPage />
            </ProtectedRoute>
          } />

          <Route path="/my-referrals" element={
            <ProtectedRoute>
              <MyReferralsPage />
            </ProtectedRoute>
          } />

          <Route path="/analytics" element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />

          {/* Unknown routes never blank the page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <Navbar />
          <AppRoutes />
        </AuthProvider>
      </GoogleOAuthProvider>
    </Router>
  );
}

export default App;