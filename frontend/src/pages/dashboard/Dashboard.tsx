import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  BarChart3,
  ChevronRight,
  Filter,
  Plus,
  Sparkles,
  Users2,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { ProductShell } from '@/components/layout/ProductShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PollCard, Poll } from '@/components/poll/PollCard';
import { StatCard } from '@/components/analytics/StatCard';
import { Badge } from '@/components/ui/Badge';

const responseTimeline = [
  { label: 'Mon', responses: 58 },
  { label: 'Tue', responses: 72 },
  { label: 'Wed', responses: 64 },
  { label: 'Thu', responses: 92 },
  { label: 'Fri', responses: 108 },
  { label: 'Sat', responses: 76 },
  { label: 'Sun', responses: 88 },
];

export function Dashboard() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['polls'],
    queryFn: async () => {
      const response = await api.get('/polls');
      return response.data.data as Poll[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <Spinner size="lg" />
      </div>
    );
  }

  const polls = data ?? [];
  const totalResponses = polls.reduce((sum, poll) => sum + (poll._count?.responses ?? 0), 0);
  const activePolls = polls.filter((poll) => poll.status === 'ACTIVE').length;
  const publishedPolls = polls.filter((poll) => poll.status === 'PUBLISHED').length;
  const responseVelocity = polls.length > 0 ? `${Math.max(12, Math.round(totalResponses / Math.max(polls.length, 1)))} / poll` : 'Calm start';

  return (
    <ProductShell
      eyebrow="Realtime workspace"
      title={`Welcome back, ${user?.displayName ?? 'there'}.`}
      description="Your polling workspace is designed to stay quiet while the room moves. Track live response flow, recent activity, and the next action worth taking."
      actions={
        <>
          <Button variant="outline">
            <Filter className="h-4 w-4" />
            Filter view
          </Button>
          <Link to="/polls/new">
            <Button>
              <Plus className="h-4 w-4" />
              Create poll
            </Button>
          </Link>
        </>
      }
    >
      <div className="space-y-8 pb-24 lg:pb-0">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total polls"
            value={polls.length}
            icon={<BarChart3 className="h-5 w-5" />}
            trend="+12%"
            hint="Last 30 days"
            tone="accent"
          />
          <StatCard
            label="Responses captured"
            value={totalResponses}
            icon={<Users2 className="h-5 w-5" />}
            trend="+18%"
            hint="Across all sessions"
            tone="success"
          />
          <StatCard
            label="Live right now"
            value={activePolls}
            icon={<Activity className="h-5 w-5" />}
            hint={responseVelocity}
            live={activePolls > 0}
            tone="accent"
          />
          <StatCard
            label="Published results"
            value={publishedPolls}
            icon={<Sparkles className="h-5 w-5" />}
            hint="Ready to share"
            tone="neutral"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Response pulse</p>
                <h2 className="mt-2 text-3xl">Live activity this week</h2>
              </div>
              <Badge variant="active">Realtime trend</Badge>
            </div>

            <div className="mt-8 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={responseTimeline}>
                  <defs>
                    <linearGradient id="dashboard-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.24} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(26, 23, 20, 0.06)" />
                  <XAxis axisLine={false} tickLine={false} dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <Tooltip cursor={false} contentStyle={tooltipStyle} />
                  <Area
                    dataKey="responses"
                    type="monotone"
                    stroke="var(--accent)"
                    strokeWidth={2.5}
                    fill="url(#dashboard-area)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
            <Card className="p-6 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Facilitator note</p>
              <h2 className="mt-3 text-2xl leading-tight">Your strongest live sessions are the ones with one clear question and one next step.</h2>
              <p className="mt-4 text-sm leading-7">
                Recent polls with fewer, more intentional options are converting better and finishing faster.
              </p>
              <Link to="/polls/new" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-accent">
                Start a tighter poll
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Card>

            <Card className="p-6 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Session mix</p>
              <div className="mt-5 space-y-4">
                {[
                  ['Workshop retrospectives', '38%'],
                  ['Town hall Q and A', '27%'],
                  ['Research validation', '21%'],
                  ['Classroom checkpoints', '14%'],
                ].map(([label, value], index) => (
                  <div key={label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-primary">{label}</span>
                      <span className="text-text-secondary">{value}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-accent" style={{ width: value, opacity: 1 - index * 0.14 }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Recent polls</p>
              <h2 className="mt-2 text-3xl">Manage the sessions that matter right now.</h2>
            </div>
            {polls.length > 0 ? (
              <Link to="/polls/new">
                <Button variant="ghost">
                  New poll
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : null}
          </div>

          {polls.length > 0 ? (
            <div className="grid gap-5">
              {polls.slice(0, 4).map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          ) : (
            <Card className="p-10 sm:p-12">
              <div className="mx-auto max-w-lg text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Nothing live yet</p>
                <h3 className="mt-3 text-3xl">Create your first poll and let the room speak.</h3>
                <p className="mt-4 text-base leading-7">
                  Start with a single question, launch it instantly, and watch analytics begin to take shape in real time.
                </p>
                <Link to="/polls/new" className="mt-8 inline-flex">
                  <Button>
                    Create first poll
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </ProductShell>
  );
}

const tooltipStyle = {
  borderRadius: '18px',
  border: '1px solid rgba(26, 23, 20, 0.08)',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  boxShadow: 'var(--shadow-medium)',
};
