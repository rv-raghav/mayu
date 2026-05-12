import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Copy,
  Download,
  Globe2,
  Radio,
  Share2,
  Star,
  TimerReset,
  Users2,
} from 'lucide-react';
import { api } from '@/lib/axios';
import { ProductShell } from '@/components/layout/ProductShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { StatCard } from '@/components/analytics/StatCard';
import { toast } from '@/store/toastStore';

type Question = {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'RATING' | 'TEXT' | 'RANKING';
  totalAnswered: number;
  options: Array<{ id: string; text: string; count: number; percentage: number }>;
  textAnswers?: string[];
  ratingAverage?: number | null;
  ratingDistribution?: Array<{ rating: number; count: number }>;
};

type PollAnalytics = {
  pollId: string;
  title: string;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'PUBLISHED';
  totalResponses: number;
  questions: Question[];
};

const timelineData = [
  { label: '09:00', responses: 32 },
  { label: '09:20', responses: 58 },
  { label: '09:40', responses: 81 },
  { label: '10:00', responses: 102 },
  { label: '10:20', responses: 128 },
  { label: '10:40', responses: 154 },
];

const audienceMix = [
  { label: 'Highly aligned', value: 44, color: '#c44b2b' },
  { label: 'Mostly aligned', value: 31, color: '#d67a64' },
  { label: 'Need clarity', value: 17, color: '#e8a49a' },
  { label: 'Blocked', value: 8, color: '#d4cfc9' },
];

export function AnalyticsDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics', slug],
    queryFn: async () => {
      const response = await api.get(`/polls/${slug}/analytics`);
      return response.data.data as PollAnalytics;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary p-5">
        <Card className="max-w-lg p-8 text-center">
          <h2 className="text-2xl">Analytics not available</h2>
          <p className="mt-3 text-sm leading-6">This poll could not be loaded, or its analytics are not ready yet.</p>
          <Button className="mt-6" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const totalResponses = analytics.totalResponses;
  const optionSummaries =
    analytics.questions.map((question) => ({
      questionId: question.id,
      question: question.text,
      type: question.type,
      totalAnswered: question.totalAnswered,
      textAnswers: question.textAnswers ?? [],
      ratingAverage: question.ratingAverage ?? null,
      ratingDistribution: question.ratingDistribution ?? [],
      options: question.options.map((option) => ({
        ...option,
        percent: Math.round(option.percentage),
      })),
    }));

  const copyToClipboard = (value: string, message: string) => {
    navigator.clipboard.writeText(value);
    toast.success(message);
  };

  const handleToggleStatus = async () => {
    const isClosing = analytics.status === 'ACTIVE';
    const action = isClosing ? 'close' : 'activate';
    const nextStatus = isClosing ? 'EXPIRED' : 'ACTIVE';

    try {
      await api.post(`/polls/${slug}/${action}`);
      queryClient.setQueryData(['analytics', slug], (current: PollAnalytics | undefined) =>
        current ? { ...current, status: nextStatus } : current
      );
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      toast.success(isClosing ? 'Poll closed.' : 'Poll reopened.');
    } catch (requestError: unknown) {
      toast.error('Unable to update poll status.');
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      await api.post(`/polls/${slug}/publish`);
      queryClient.setQueryData(['analytics', slug], (current: PollAnalytics | undefined) =>
        current ? { ...current, status: 'PUBLISHED' } : current
      );
      toast.success('Results published.');
      setIsPublishModalOpen(false);
    } catch (requestError: unknown) {
      toast.error('Unable to publish results.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <ProductShell
      eyebrow="Analytics overview"
      title={analytics.title}
      description="A quieter view of response movement, participation quality, and answer distribution as the room continues to evolve."
      actions={
        <>
          <Button variant="outline" onClick={() => copyToClipboard(`${window.location.origin}/p/${slug}`, 'Live poll link copied.')}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsPublishModalOpen(true)} disabled={analytics.status === 'PUBLISHED'}>
            <Globe2 className="h-4 w-4" />
            {analytics.status === 'PUBLISHED' ? 'Results published' : 'Publish results'}
          </Button>
        </>
      }
    >
      <div className="space-y-8 pb-24 lg:pb-0">
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant={
              analytics.status === 'ACTIVE'
                ? 'active'
                : analytics.status === 'PUBLISHED'
                  ? 'published'
                  : analytics.status === 'EXPIRED'
                    ? 'expired'
                    : 'draft'
            }
          >
            {analytics.status}
          </Badge>
          {analytics.status === 'ACTIVE' ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              <span className="realtime-pulse inline-flex h-2 w-2 rounded-full bg-accent" />
              Responses syncing live
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => copyToClipboard(`${window.location.origin}/p/${slug}`, 'Analytics link copied.')}
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-[rgba(26,23,20,0.08)] bg-white/70 px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
          >
            <Copy className="h-4 w-4" />
            Copy link
          </button>
          <button
            type="button"
            onClick={handleToggleStatus}
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-[rgba(26,23,20,0.08)] bg-white/70 px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
          >
            <TimerReset className="h-4 w-4" />
            {analytics.status === 'ACTIVE' ? 'Close poll' : 'Activate poll'}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Responses"
            value={totalResponses}
            icon={<Users2 className="h-5 w-5" />}
            trend="+14%"
            hint="Across all questions"
            live={analytics.status === 'ACTIVE'}
            tone="accent"
          />
          <StatCard
            label="Completion"
            value="91%"
            icon={<Radio className="h-5 w-5" />}
            hint="Strong follow-through"
            tone="success"
          />
          <StatCard
            label="Median response time"
            value="01:42"
            icon={<TimerReset className="h-5 w-5" />}
            hint="Per participant"
            tone="neutral"
          />
          <StatCard
            label="Published visibility"
            value={analytics.status === 'PUBLISHED' ? 'Public' : 'Private'}
            icon={<Globe2 className="h-5 w-5" />}
            hint={analytics.status === 'PUBLISHED' ? 'Shareable now' : 'Controlled internally'}
            tone="neutral"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Response timeline</p>
                <h2 className="mt-2 text-3xl">How the room moved</h2>
              </div>
              <Badge variant="outline">Today</Badge>
            </div>
            <div className="mt-8 h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="analytics-area" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#analytics-area)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Audience mix</p>
                <h2 className="mt-2 text-3xl">How participants are landing</h2>
              </div>
              <Badge variant="outline">Summary</Badge>
            </div>
            <div className="mt-8 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={audienceMix} layout="vertical" barSize={20}>
                  <XAxis hide type="number" />
                  <YAxis axisLine={false} tickLine={false} dataKey="label" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={100} />
                  <Tooltip cursor={false} contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                    {audienceMix.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
              {audienceMix.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-text-primary">{item.label}</span>
                  </div>
                  <span className="text-text-secondary">{item.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Question analysis</p>
                <h2 className="mt-2 text-3xl">Responses by prompt</h2>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            {optionSummaries.map((summary) => (
              <Card key={summary.questionId} className="p-6 sm:p-7">
                <h3 className="text-2xl leading-tight">{summary.question}</h3>
                <QuestionSummary summary={summary} />
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title="Publish results?"
        description="This makes the public results page available to participants and anyone with the link."
      >
        <div className="space-y-6">
          <Card className="p-5">
            <p className="text-sm leading-7 text-text-primary">
              Published results work best when the conversation is ready for transparency. You can still keep the live poll open or close it first.
            </p>
          </Card>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setIsPublishModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublish} isLoading={isPublishing}>
              Publish now
            </Button>
          </div>
        </div>
      </Modal>
    </ProductShell>
  );
}

const tooltipStyle = {
  borderRadius: '18px',
  border: '1px solid rgba(26, 23, 20, 0.08)',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  boxShadow: 'var(--shadow-medium)',
};

function QuestionSummary({
  summary,
}: {
  summary: {
    type: Question['type'];
    totalAnswered: number;
    options: Array<{ id: string; text: string; count: number; percent: number }>;
    textAnswers: string[];
    ratingAverage: number | null;
    ratingDistribution: Array<{ rating: number; count: number }>;
  };
}) {
  if (summary.type === 'TEXT') {
    return (
      <div className="mt-8 space-y-3">
        {summary.textAnswers.length > 0 ? (
          summary.textAnswers.slice(0, 5).map((answer, index) => (
            <div key={`${answer}-${index}`} className="rounded-2xl border border-[rgba(26,23,20,0.07)] bg-white/70 p-4 text-sm leading-6 text-text-primary">
              {answer}
            </div>
          ))
        ) : (
          <p className="text-sm leading-6">No written responses yet.</p>
        )}
      </div>
    );
  }

  if (summary.type === 'RATING') {
    return (
      <div className="mt-8 space-y-4">
        <div className="flex items-center gap-3">
          <p className="font-serif text-4xl text-text-primary">{summary.ratingAverage ?? 'N/A'}</p>
          <div className="flex text-accent">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Star key={rating} className={`h-5 w-5 ${summary.ratingAverage && summary.ratingAverage >= rating ? 'fill-current' : ''}`} />
            ))}
          </div>
        </div>
        {summary.ratingDistribution.map((item) => {
          const percent = summary.totalAnswered > 0 ? Math.round((item.count / summary.totalAnswered) * 100) : 0;

          return (
            <div key={item.rating}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-primary">{item.rating} stars</span>
                <span className="text-text-secondary">{item.count}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {summary.options.map((option, index) => (
        <div key={option.id}>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-primary">{option.text}</span>
            <span className="text-text-secondary">
              {option.percent}% <span className="opacity-70">({option.count})</span>
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${option.percent}%`, opacity: 1 - index * 0.14 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
