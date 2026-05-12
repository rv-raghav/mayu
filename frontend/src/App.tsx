import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';

import { Landing } from './pages/Landing';
import { SignIn } from './pages/auth/SignIn';
import { SignUp } from './pages/auth/SignUp';
import { Dashboard } from './pages/dashboard/Dashboard';
import { CreatePoll } from './pages/polls/CreatePoll';
import { PublicPoll } from './pages/polls/PublicPoll';
import { ResultsPage } from './pages/polls/ResultsPage';
import { AnalyticsDashboard } from './pages/analytics/AnalyticsDashboard';
import { NotFound } from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Public Pages */}
            <Route path="/" element={<Landing />} />
            
            {/* Guest Only Pages (redirects to dashboard if logged in) */}
            <Route element={<PublicRoute />}>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
            </Route>

            {/* Protected Pages */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/polls/new" element={<CreatePoll />} />
              <Route path="/polls/:slug/analytics" element={<AnalyticsDashboard />} />
            </Route>

            {/* Public Poll Pages */}
            <Route path="/p/:slug" element={<PublicPoll />} />
            <Route path="/p/:slug/results" element={<ResultsPage />} />

            {/* 404 Catch All */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
