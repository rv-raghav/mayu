import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { ToastContainer } from '../ui/Toast';
import { PageContainer } from './PageContainer';

export function AppLayout() {
  const location = useLocation();
  const isProductShellRoute =
    location.pathname === '/dashboard' ||
    location.pathname === '/polls/new' ||
    /^\/polls\/[^/]+\/analytics$/.test(location.pathname);
  const isImmersiveRoute = isProductShellRoute || location.pathname.startsWith('/p/');

  if (isImmersiveRoute) {
    return (
      <div className="min-h-screen">
        <ToastContainer />
        <main className="flex min-h-screen flex-col">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ToastContainer />
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="mt-auto border-t section-divider bg-white/35 py-8">
        <PageContainer className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-text-secondary">Crafted for realtime clarity.</p>
          <p className="text-text-secondary/80">
            Premium polling and analytics with a calmer rhythm.
          </p>
        </PageContainer>
      </footer>
    </div>
  );
}
