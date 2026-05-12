import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { PageContainer } from './PageContainer';
import { ArrowRight, Command, LogOut } from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore errors on logout
    } finally {
      clearAuth();
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b section-divider bg-primary/78 backdrop-blur-xl">
      <PageContainer>
        <div className="flex h-18 items-center justify-between gap-6 py-4">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="group flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(26,23,20,0.08)] bg-white/80 text-accent shadow-soft">
              <Command className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-serif text-2xl leading-none text-text-primary">MaYu</span>
              <span className="hidden text-xs uppercase tracking-[0.22em] text-text-secondary sm:block">
                Pulse the room
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {!isAuthenticated ? (
              <>
                <a href="#features" className="text-sm text-text-secondary hover:text-text-primary">Features</a>
                <a href="#demo" className="text-sm text-text-secondary hover:text-text-primary">Demo</a>
                <a href="#pricing" className="text-sm text-text-secondary hover:text-text-primary">Pricing</a>
                <a href="#docs" className="text-sm text-text-secondary hover:text-text-primary">Docs</a>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="text-sm text-text-secondary hover:text-text-primary">Dashboard</Link>
                <Link to="/polls/new" className="text-sm text-text-secondary hover:text-text-primary">Build</Link>
                <span className="text-sm text-text-secondary">Analytics</span>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="hidden items-center gap-3 rounded-full border border-[rgba(26,23,20,0.08)] bg-white/70 px-2 py-2 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-text-primary">
                    {user?.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="pr-3">
                    <p className="max-w-[140px] truncate text-sm font-medium text-text-primary">{user?.displayName}</p>
                    <p className="max-w-[140px] truncate text-xs text-text-secondary">{user?.email}</p>
                  </div>
                </div>
                <Link to="/dashboard">
                  <Button variant="outline" className={location.pathname === '/dashboard' ? 'bg-secondary' : undefined}>
                    Workspace
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button>
                    Start Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </PageContainer>
    </header>
  );
}
