import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Globe2, Star } from 'lucide-react';
import { api } from '@/lib/axios';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

type PublicResultOption = {
  id: string;
  text: string;
  count: number;
};

type PublicResultQuestion = {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'RATING' | 'TEXT' | 'RANKING';
  totalAnswered: number;
  options: PublicResultOption[];
  textAnswers?: string[];
  ratingAverage?: number | null;
  ratingDistribution?: Array<{ rating: number; count: number }>;
};

type PublicResults = {
  title: string;
  totalResponses: number;
  questions: PublicResultQuestion[];
};

export function ResultsPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['results', slug],
    queryFn: async () => {
      const response = await api.get(`/polls/${slug}/results`);
      return response.data.data as PublicResults;
    },
    retry: false,
  });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-primary"><Spinner size="lg" /></div>;
  }

  if (error || !analytics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary px-5">
        <Card className="max-w-lg p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/60">
            <AlertCircle className="h-9 w-9 text-accent" />
          </div>
          <h1 className="mt-6 text-3xl">Results not available</h1>
          <p className="mt-4 text-base leading-7">
            This poll may not exist, or the facilitator has not published the public results yet.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary py-10 sm:py-14">
      <PageContainer size="reading">
        <div className="space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="paper-surface p-6 text-center sm:p-10">
              <Badge variant="published" className="mx-auto w-fit">
                Public results
              </Badge>
              <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">{analytics.title}</h1>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[rgba(26,23,20,0.08)] bg-white/78 px-4 py-2 text-sm text-text-secondary">
                <Globe2 className="h-4 w-4" />
                <span className="font-medium text-text-primary">{analytics.totalResponses}</span>
                total responses
              </div>
            </div>
          </Card>

          {analytics.questions.map((question, index) => (
              <Card key={question.id} className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">
                      Question {index + 1}
                    </p>
                    <h2 className="mt-3 text-2xl leading-tight sm:text-3xl">{question.text}</h2>
                  </div>
                  <Badge variant="outline">{question.totalAnswered} answered</Badge>
                </div>

                <ResultQuestionSummary question={question} />
              </Card>
          ))}
        </div>
      </PageContainer>
    </div>
  );
}

function ResultQuestionSummary({ question }: { question: PublicResultQuestion }) {
  if (question.type === 'TEXT') {
    return (
      <div className="mt-8 space-y-3">
        {(question.textAnswers ?? []).length > 0 ? (
          question.textAnswers?.slice(0, 8).map((answer, index) => (
            <div key={`${answer}-${index}`} className="rounded-2xl border border-[rgba(26,23,20,0.07)] bg-white/70 p-4 text-sm leading-6 text-text-primary">
              {answer}
            </div>
          ))
        ) : (
          <p className="text-sm leading-6">No written responses were published.</p>
        )}
      </div>
    );
  }

  if (question.type === 'RATING') {
    return (
      <div className="mt-8 space-y-4">
        <div className="flex items-center gap-3">
          <p className="font-serif text-4xl text-text-primary">{question.ratingAverage ?? 'N/A'}</p>
          <div className="flex text-accent">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Star key={rating} className={`h-5 w-5 ${question.ratingAverage && question.ratingAverage >= rating ? 'fill-current' : ''}`} />
            ))}
          </div>
        </div>
        {(question.ratingDistribution ?? []).map((item) => {
          const percent = question.totalAnswered > 0 ? Math.round((item.count / question.totalAnswered) * 100) : 0;

          return (
            <div key={item.rating}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-text-primary">{item.rating} stars</span>
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

  const highestCount = Math.max(...question.options.map((option) => option.count), 0);

  return (
    <div className="mt-8 space-y-4">
      {question.options.map((option, optionIndex) => {
        const percent = question.totalAnswered > 0 ? Math.round((option.count / question.totalAnswered) * 100) : 0;
        const winner = option.count === highestCount && option.count > 0;

        return (
          <div key={option.id}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className={winner ? 'font-medium text-accent' : 'font-medium text-text-primary'}>{option.text}</span>
              <span className="text-text-secondary">
                {percent}% <span className="opacity-70">({option.count})</span>
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={winner ? 'h-full rounded-full bg-accent' : 'h-full rounded-full bg-accent-soft'}
                style={{ width: `${percent}%`, opacity: 1 - optionIndex * 0.1 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
