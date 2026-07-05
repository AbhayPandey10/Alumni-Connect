import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, ShieldCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';

const Wordmark = ({ to }) => (
  <Link to={to} className="group flex items-center gap-2.5">
    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-paper">
      <ShieldCheck size={16} strokeWidth={2.2} />
    </span>
    <span className="text-[19px] font-bold tracking-[-0.03em] text-ink">
      Alumni<span className="text-muted group-hover:text-ink transition-colors">Connect</span>
    </span>
  </Link>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Close menus on navigation
  useEffect(() => { setAccountOpen(false); setMobileOpen(false); }, [location.pathname]);

  // The landing page ('/') ships its own navigation
  if (location.pathname === '/') return null;

  // Minimal bar on the auth screens
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/verify') {
    return (
      <nav className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur-md">
        <div className="shell flex h-16 items-center">
          <Wordmark to="/" />
        </div>
      </nav>
    );
  }

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    setMobileOpen(false);
  };

  const isStudent = user?.role === 'Student';
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()
    || user?.email?.[0]?.toUpperCase() || '?';
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : (user?.username || user?.email?.split('@')[0] || 'Account');

  // Primary destinations stay inline; everything else lives in the account menu
  const primaryLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/jobs', label: 'Opportunities' },
    { to: '/directory', label: 'Directory' },
    { to: '/connections', label: 'Network' },
    { to: '/analytics', label: 'Analytics' },
  ];
  const accountLinks = [
    ...(user?.role === 'Admin' ? [{ to: '/admin', label: 'Admin dashboard' }] : []),
    ...(isStudent
      ? [{ to: '/career-guidance', label: 'Career AI' }, { to: '/interview-prep', label: 'Interview Prep' }, { to: '/my-referrals', label: 'My Requests' }]
      : [{ to: '/my-postings', label: 'My Postings' }, { to: '/referrals', label: 'Referral Requests' }]),
    { to: isStudent ? '/profile/setup/student' : '/profile/setup/alumni', label: 'Profile' },
  ];

  const isActive = (to) => location.pathname === to;

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur-md">
        <div className="shell flex h-16 items-center justify-between">
          <Wordmark to={user ? '/dashboard' : '/'} />

          {user ? (
            <>
              {/* Desktop */}
              <div className="hidden items-center gap-1 md:flex">
                {primaryLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative px-3.5 py-2 text-sm font-medium transition-colors ${
                      isActive(link.to) ? 'text-ink' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {link.label}
                    {isActive(link.to) && (
                      <span className="absolute inset-x-3.5 -bottom-[1px] h-[2px] rounded-full bg-ink" />
                    )}
                  </Link>
                ))}

                <div className="mx-2 h-5 w-px bg-line" />
                <NotificationBell />

                {/* Account dropdown */}
                <div className="relative ml-1" ref={accountRef}>
                  <button
                    onClick={() => setAccountOpen((o) => !o)}
                    className={`flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2 transition-colors ${
                      accountOpen ? 'border-line-strong bg-paper-2' : 'border-line hover:bg-paper-2'
                    }`}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-paper">
                      {initials}
                    </span>
                    <ChevronDown size={14} className={`text-muted transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {accountOpen && (
                    <div className="card animate-fade-up absolute right-0 mt-2 w-60 overflow-hidden p-0 shadow-xl">
                      <div className="border-b border-line bg-paper-2 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
                        <p className="truncate text-xs text-muted">{user?.email}</p>
                        <span className="badge mt-2">{user?.role || 'Member'}</span>
                      </div>
                      <div className="py-1.5">
                        {accountLinks.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                              isActive(link.to) ? 'bg-paper-2 text-ink' : 'text-muted hover:bg-paper-2 hover:text-ink'
                            }`}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-line py-1.5">
                        <button
                          onClick={() => { setAccountOpen(false); setShowLogoutModal(true); }}
                          className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-muted transition-colors hover:bg-paper-2 hover:text-ink"
                        >
                          <LogOut size={15} /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile controls */}
              <div className="flex items-center gap-1 md:hidden">
                <NotificationBell />
                <button
                  onClick={() => setMobileOpen((o) => !o)}
                  className="p-2 text-muted transition-colors hover:text-ink"
                  aria-label="Toggle menu"
                >
                  {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost">Log in</Link>
              <Link to="/register" className="btn-primary">Join Now</Link>
            </div>
          )}
        </div>

        {/* Mobile dropdown */}
        {user && mobileOpen && (
          <div className="animate-fade-in border-t border-line bg-paper px-6 py-3 md:hidden">
            <div className="mb-2 flex items-center gap-3 border-b border-line pb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-paper">{initials}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
                <p className="truncate text-xs text-muted">{user?.email}</p>
              </div>
            </div>
            {[...primaryLinks, ...accountLinks].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(link.to) ? 'bg-paper-2 text-ink' : 'text-muted hover:bg-paper-2 hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => { setMobileOpen(false); setShowLogoutModal(true); }}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-paper-2 hover:text-ink"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        )}
      </nav>

      {showLogoutModal && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-sm animate-fade-up p-6">
            <h3 className="text-lg font-bold text-ink">Confirm logout</h3>
            <p className="mt-1.5 text-sm text-muted">Are you sure you want to sign out of your account?</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowLogoutModal(false)} className="btn-ghost">Cancel</button>
              <button onClick={confirmLogout} className="btn-primary">Logout</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
