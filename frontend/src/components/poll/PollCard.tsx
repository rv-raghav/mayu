import { Link } from 'react-router-dom';
import { ArrowUpRight, BarChart3, Clock3, Copy, Radio } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/toastStore';

export interface Poll {
  id: string;
  slug: string;
  title: string;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'PUBLISHED';
  expiresAt?: string | null;
  _count?: {
    responses?: number;
  };
}

const statusVariant: Record<Poll['status'], 'active' | 'published' | 'expired' | 'draft'> = {
  ACTIVE: 'active',
  PUBLISHED: 'published',
  EXPIRED: 'expired',
  DRAFT: 'draft',
};

export function PollCard({ poll }: { poll: Poll }) {
  const responseCount = poll._count?.responses ?? 0;
  const isActive = poll.status === 'ACTIVE';

  return (
    <Link to={`/polls/${poll.slug}/analytics`} className="block">
      <Card className="group h-full p-6 hover:-translate-y-1 hover:shadow-medium sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant[poll.status]}>{poll.status}</Badge>
              {isActive ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-accent/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                  <span className="realtime-pulse inline-flex h-2 w-2 rounded-full bg-accent" />
                  Live
                </span>
              ) : null}
            </div>
            <div>
              <h3 className="text-2xl leading-tight transition-colors group-hover:text-accent">{poll.title}</h3>
              <p className="mt-2 max-w-xl text-sm leading-6">
                Manage responses, reopen the poll, and watch audience movement without losing the narrative.
              </p>
            </div>
          </div>
          <div className="hidden rounded-full border border-[rgba(26,23,20,0.08)] bg-white/70 p-2 text-text-secondary transition-colors group-hover:text-text-primary sm:block">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-8 grid gap-4 border-t section-divider pt-6 sm:grid-cols-3">
          <div className="rounded-2xl bg-secondary/55 px-4 py-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-secondary">
              <BarChart3 className="h-4 w-4" />
              Responses
            </div>
            <p className="mt-3 font-serif text-3xl text-text-primary">{responseCount}</p>
          </div>
          <div className="rounded-2xl bg-secondary/40 px-4 py-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-secondary">
              <Clock3 className="h-4 w-4" />
              Status
            </div>
            <p className="mt-3 text-sm font-medium text-text-primary">
              {poll.expiresAt ? `${poll.status === 'EXPIRED' ? 'Ended' : 'Ends'} ${new Date(poll.expiresAt).toLocaleDateString()}` : 'No deadline set'}
            </p>
          </div>
          <div className="rounded-2xl bg-secondary/30 px-4 py-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-secondary">
              {isActive ? <Radio className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Quick action
            </div>
            {isActive ? (
              <Button
                variant="ghost"
                className="-ml-3 mt-1 px-3 text-text-primary hover:bg-white/70"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  navigator.clipboard.writeText(`${window.location.origin}/p/${poll.slug}`);
                  toast.success('Live poll link copied.');
                }}
              >
                Copy share link
              </Button>
            ) : (
              <p className="mt-3 text-sm text-text-primary">Open analytics and adjust timing, visibility, or publication.</p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
