import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { AlertCircle, CheckCircle2, GripVertical, LockKeyhole, Radio, Star } from 'lucide-react';
import { api } from '@/lib/axios';
import { usePublicSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/authStore';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';

type PublicQuestion = {
  id: string;
  text: string;
  type?: 'MULTIPLE_CHOICE' | 'RATING' | 'TEXT' | 'RANKING';
  isMandatory: boolean;
  options: Array<{ id: string; text: string }>;
};

type AnswerValue = string | number | string[] | undefined;
type SubmittedAnswer =
  | { questionId: string; optionId: string }
  | { questionId: string; textValue: string }
  | { questionId: string; ratingValue: number }
  | { questionId: string; rankingValue: string[] };

type PublicPollResponse = {
  title: string;
  description?: string;
  status: 'ACTIVE' | 'DRAFT' | 'EXPIRED' | 'PUBLISHED';
  requiresAuth: boolean;
  questions: PublicQuestion[];
};

export function PublicPoll() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const socket = usePublicSocket(slug);
  const { isAuthenticated } = useAuthStore();
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: poll, isLoading, error: fetchError, refetch } = useQuery({
    queryKey: ['poll', slug],
    queryFn: async () => {
      const response = await api.get(`/polls/${slug}`);
      return response.data.data as PublicPollResponse;
    },
    retry: false,
  });

  const { control, handleSubmit, formState: { isSubmitting }, watch } = useForm<Record<string, AnswerValue>>();
  const answers = watch();

  useEffect(() => {
    if (!socket) {
      return;
    }

    const refreshPoll = () => {
      refetch();
    };

    socket.on('poll:status', refreshPoll);
    socket.on('poll:expired', refreshPoll);

    return () => {
      socket.off('poll:status', refreshPoll);
      socket.off('poll:expired', refreshPoll);
    };
  }, [socket, refetch]);

  const getSessionToken = () => {
    let token = localStorage.getItem('mayu_session_token');

    if (!token) {
      token = window.crypto?.randomUUID?.() ?? '00000000-0000-4000-a000-000000000000';
      localStorage.setItem('mayu_session_token', token);
    }

    return token;
  };

  const onSubmit = async (data: Record<string, AnswerValue>) => {
    if (!poll) {
      return;
    }

    try {
      setSubmitError(null);
      const formattedAnswers: SubmittedAnswer[] = poll.questions.flatMap<SubmittedAnswer>((question) => {
        const value = data[question.id];
        const type = question.type ?? 'MULTIPLE_CHOICE';

        if (type === 'MULTIPLE_CHOICE' && typeof value === 'string') {
          return [{ questionId: question.id, optionId: value }];
        }

        if (type === 'TEXT' && typeof value === 'string' && value.trim().length > 0) {
          return [{ questionId: question.id, textValue: value.trim() }];
        }

        if (type === 'RATING' && typeof value === 'number') {
          return [{ questionId: question.id, ratingValue: value }];
        }

        if (type === 'RANKING' && Array.isArray(value) && value.length === question.options.length) {
          return [{ questionId: question.id, rankingValue: value }];
        }

        return [];
      });

      await api.post(`/polls/${slug}/respond`, {
        sessionToken: getSessionToken(),
        answers: formattedAnswers,
      });

      setIsSuccess(true);
    } catch (requestError: unknown) {
      if ((requestError as { response?: { status?: number } })?.response?.status === 401 && poll?.requiresAuth) {
        navigate('/signin', { state: { from: `/p/${slug}` } });
      } else {
        setSubmitError('Unable to submit your response.');
      }
    }
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-primary"><Spinner size="lg" /></div>;
  }

  if (fetchError || !poll) {
    return (
      <CenteredState
        title="Poll not found"
        description="This poll may have been removed or the link may be incomplete."
        icon={<AlertCircle className="h-10 w-10 text-accent" />}
      />
    );
  }

  if (poll.status === 'EXPIRED' || poll.status === 'DRAFT') {
    return (
      <CenteredState
        title={poll.status === 'EXPIRED' ? 'This poll has ended' : 'This poll is not open yet'}
        description={
          poll.status === 'EXPIRED'
            ? 'Responses are no longer being accepted for this session.'
            : 'Please wait for the facilitator to open the poll.'
        }
        icon={<Radio className="h-10 w-10 text-accent" />}
      />
    );
  }

  if (poll.requiresAuth && !isAuthenticated) {
    return (
      <CenteredState
        title="Authentication required"
        description="This session is reserved for signed-in participants."
        icon={<LockKeyhole className="h-10 w-10 text-accent" />}
        action={
          <Button onClick={() => navigate('/signin', { state: { from: `/p/${slug}` } })}>
            Sign in to respond
          </Button>
        }
      />
    );
  }

  if (isSuccess) {
    return (
      <CenteredState
        title="Response captured"
        description="Thank you. Your answer has been recorded and the live analytics have updated."
        icon={<CheckCircle2 className="h-10 w-10 text-success" />}
        action={
          <Button variant="outline" onClick={() => navigate(`/p/${slug}/results`)}>
            View public results
          </Button>
        }
      />
    );
  }

  const answeredCount = poll.questions.filter((question) => isAnswered(question, answers?.[question.id])).length;
  const totalQuestions = poll.questions.length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const canSubmit = poll.questions.every((question) => !question.isMandatory || isAnswered(question, answers?.[question.id]));

  return (
    <div className="min-h-screen bg-primary py-8 sm:py-12">
      <PageContainer size="reading">
        <div className="space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="paper-surface p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Badge variant="active">Live poll</Badge>
                  <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">{poll.title}</h1>
                  {poll.description ? <p className="mt-4 max-w-2xl text-base leading-7 sm:text-lg">{poll.description}</p> : null}
                </div>
                <div className="rounded-2xl border border-[rgba(26,23,20,0.08)] bg-white/78 px-4 py-3 text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Progress</p>
                  <p className="mt-2 font-serif text-3xl text-text-primary">{progressPercent}%</p>
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between text-sm text-text-secondary">
                  <span>{answeredCount} of {totalQuestions} answered</span>
                  <span>{poll.requiresAuth ? 'Private session' : 'Open session'}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>
          </Card>

          {submitError ? (
            <Card className="border-red-200 bg-red-50/70 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <p className="text-sm leading-6 text-red-700">{submitError}</p>
              </div>
            </Card>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {poll.questions.map((question, index) => (
              <Card key={question.id} className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">
                      Question {index + 1}
                    </p>
                    <h2 className="mt-3 text-2xl leading-tight sm:text-3xl">{question.text}</h2>
                  </div>
                  {question.isMandatory ? <Badge variant="outline">Required</Badge> : null}
                </div>

                <Controller
                  name={question.id}
                  control={control}
                  rules={{
                    validate: (value) => !question.isMandatory || isAnswered(question, value) || 'Required',
                  }}
                  render={({ field }) => (
                    <QuestionAnswerInput question={question} value={field.value} onChange={field.onChange} name={field.name} />
                  )}
                />
              </Card>
            ))}

            <div className="flex flex-col gap-3 border-t section-divider pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-text-secondary">
                {canSubmit ? 'Everything required is answered.' : 'Please answer each required question before submitting.'}
              </p>
              <Button type="submit" size="lg" isLoading={isSubmitting} disabled={!canSubmit}>
                Submit response
              </Button>
            </div>
          </form>
        </div>
      </PageContainer>
    </div>
  );
}

function QuestionAnswerInput({
  question,
  value,
  onChange,
  name,
}: {
  question: PublicQuestion;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  name: string;
}) {
  const type = question.type ?? 'MULTIPLE_CHOICE';

  if (type === 'TEXT') {
    return (
      <div className="mt-8">
        <textarea
          name={name}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          rows={5}
          className="focus-ring min-h-36 w-full rounded-2xl border border-[rgba(26,23,20,0.08)] bg-white/72 px-4 py-4 text-base leading-7 text-text-primary placeholder:text-text-secondary/50"
          placeholder="Write your response..."
        />
      </div>
    );
  }

  if (type === 'RATING') {
    const selectedRating = typeof value === 'number' ? value : 0;

    return (
      <div className="mt-8 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((rating) => {
          const selected = selectedRating >= rating;

          return (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              className="focus-ring rounded-2xl border border-[rgba(26,23,20,0.08)] bg-white/72 p-4 text-accent transition-colors hover:bg-secondary/40"
              aria-label={`${rating} star${rating > 1 ? 's' : ''}`}
            >
              <Star className={`h-7 w-7 ${selected ? 'fill-current' : ''}`} />
            </button>
          );
        })}
      </div>
    );
  }

  if (type === 'RANKING') {
    const rankedIds = Array.isArray(value) ? value : [];
    const availableOptions = question.options.filter((option) => !rankedIds.includes(option.id));

    return (
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Choose order</p>
          {availableOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange([...rankedIds, option.id])}
              className="focus-ring flex w-full items-center gap-3 rounded-2xl border border-[rgba(26,23,20,0.07)] bg-white/72 px-4 py-4 text-left hover:border-[rgba(26,23,20,0.12)]"
            >
              <GripVertical className="h-4 w-4 text-text-secondary" />
              <span className="text-sm font-medium text-text-primary sm:text-base">{option.text}</span>
            </button>
          ))}
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Your ranking</p>
            {rankedIds.length > 0 ? (
              <button type="button" onClick={() => onChange([])} className="text-sm font-medium text-accent">
                Clear
              </button>
            ) : null}
          </div>
          {rankedIds.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[rgba(26,23,20,0.16)] bg-white/50 px-4 py-6 text-sm text-text-secondary">
              Select options in priority order.
            </div>
          ) : (
            rankedIds.map((optionId, index) => {
              const option = question.options.find((item) => item.id === optionId);

              return (
                <button
                  key={optionId}
                  type="button"
                  onClick={() => onChange(rankedIds.filter((id) => id !== optionId))}
                  className="focus-ring flex w-full items-center gap-3 rounded-2xl border border-accent/15 bg-accent/8 px-4 py-4 text-left"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-text-primary sm:text-base">{option?.text}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      {question.options.map((option) => {
        const selected = value === option.id;

        return (
          <label
            key={option.id}
            className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-4 py-4 transition-all ${
              selected
                ? 'border-accent/20 bg-accent/8'
                : 'border-[rgba(26,23,20,0.07)] bg-white/72 hover:border-[rgba(26,23,20,0.12)]'
            }`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-accent' : 'border-[rgba(26,23,20,0.2)]'}`}>
              {selected ? <span className="h-2.5 w-2.5 rounded-full bg-accent" /> : null}
            </span>
            <span className="text-sm font-medium text-text-primary sm:text-base">{option.text}</span>
            <input
              type="radio"
              className="sr-only"
              name={name}
              value={option.id}
              checked={selected}
              onChange={() => onChange(option.id)}
            />
          </label>
        );
      })}
    </div>
  );
}

function isAnswered(question: PublicQuestion, value: AnswerValue): boolean {
  const type = question.type ?? 'MULTIPLE_CHOICE';

  if (type === 'TEXT') {
    return typeof value === 'string' && value.trim().length > 0;
  }

  if (type === 'RATING') {
    return typeof value === 'number' && value >= 1 && value <= 5;
  }

  if (type === 'RANKING') {
    return Array.isArray(value) && value.length === question.options.length;
  }

  return typeof value === 'string' && value.length > 0;
}

function CenteredState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-5">
      <PageContainer size="reading">
        <Card className="mx-auto max-w-xl p-8 text-center sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/60">
            {icon}
          </div>
          <h1 className="mt-6 text-3xl">{title}</h1>
          <p className="mt-4 text-base leading-7">{description}</p>
          {action ? <div className="mt-8">{action}</div> : null}
        </Card>
      </PageContainer>
    </div>
  );
}
