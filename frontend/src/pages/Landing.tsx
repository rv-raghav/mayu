import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Layers3,
  Play,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const featureCards = [
  {
    title: 'Create in seconds',
    description: 'Shape questions, rating prompts, and structured feedback flows without slowing the room down.',
    icon: WandSparkles,
  },
  {
    title: 'Collect live responses',
    description: 'Every vote lands in real time with subtle motion that keeps attention on signal instead of spectacle.',
    icon: Activity,
  },
  {
    title: 'Understand instantly',
    description: 'Premium analytics make trends readable at a glance, from audience pulse to per-question clarity.',
    icon: BarChart3,
  },
];

const timelineData = [
  { label: '09:00', responses: 28 },
  { label: '09:15', responses: 41 },
  { label: '09:30', responses: 63 },
  { label: '09:45', responses: 74 },
  { label: '10:00', responses: 96 },
  { label: '10:15', responses: 118 },
];

const segmentData = [
  { label: 'Confidence', value: 78 },
  { label: 'Alignment', value: 64 },
  { label: 'Readiness', value: 86 },
  { label: 'Questions', value: 34 },
];

const testimonials = [
  {
    quote: 'MaYu feels like a facilitator tool designed by editors. It keeps attention on the room, not on the software.',
    name: 'Aya Nishimura',
    title: 'Program Lead, Atelier East',
  },
  {
    quote: 'We replaced clunky event polling with something that feels deliberate, calm, and much easier to trust live.',
    name: 'Morgan Lee',
    title: 'Head of Community, Northline',
  },
  {
    quote: 'The analytics are subtle in exactly the right way. We see the movement without drowning in dashboards.',
    name: 'Priya Raman',
    title: 'Research Ops, Fieldnote',
  },
];

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    description: 'For small sessions and lightweight audience feedback.',
    features: ['Unlimited drafts', 'One active poll', 'Public results', 'Basic response analytics'],
  },
  {
    name: 'Pro',
    price: '$29',
    description: 'For teams running premium sessions, research, and live events.',
    features: ['Unlimited live polls', 'Realtime analytics workspace', 'Shareable result links', 'Advanced audience insights'],
    highlighted: true,
  },
];

const pollOptions = [
  { id: 'clarity', label: 'Clarity of next steps', percent: 46 },
  { id: 'alignment', label: 'Team alignment', percent: 31 },
  { id: 'confidence', label: 'Confidence in launch', percent: 23 },
];

export function Landing() {
  const [selectedOption, setSelectedOption] = useState(pollOptions[0].id);

  const liveResults = pollOptions.map((option, index) => {
    if (option.id === selectedOption) {
      return { ...option, percent: Math.min(option.percent + 9, 78) };
    }

    const deduction = index === 1 ? 5 : 4;
    return { ...option, percent: Math.max(option.percent - deduction, 12) };
  });

  return (
    <div className="overflow-x-hidden">
      <section className="relative overflow-hidden pb-20 pt-10 sm:pb-28 sm:pt-16">
        <div className="ink-wash absolute inset-0 opacity-80" />
        <PageContainer>
          <div className="grid gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <motion.div
              className="relative z-10 space-y-10"
              initial={{ opacity: 0, y: 18, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="space-y-5">
                <Badge variant="active" className="w-fit">
                  Realtime clarity without the noise
                </Badge>
                <h1 className="max-w-3xl text-5xl leading-[0.9] sm:text-7xl xl:text-[5.8rem]">
                  Pulse the room.
                  <br />
                  Instantly.
                </h1>
                <p className="max-w-xl text-lg leading-8 text-text-secondary sm:text-xl">
                  Create elegant live polls, gather responses in real time, and understand your audience with analytics designed for clarity.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/signup">
                  <Button size="lg">
                    Start free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#demo">
                  <Button size="lg" variant="outline">
                    <Play className="h-4 w-4" />
                    View live demo
                  </Button>
                </a>
              </div>

              <div className="grid gap-5 border-t section-divider pt-8 sm:grid-cols-3">
                <div>
                  <p className="font-serif text-3xl text-text-primary">3.2M</p>
                  <p className="mt-2 text-sm leading-6">Responses captured across workshops, classrooms, and product launches.</p>
                </div>
                <div>
                  <p className="font-serif text-3xl text-text-primary">210ms</p>
                  <p className="mt-2 text-sm leading-6">Median sync time between vote and analytics refresh.</p>
                </div>
                <div>
                  <p className="font-serif text-3xl text-text-primary">94%</p>
                  <p className="mt-2 text-sm leading-6">Facilitators say the interface helps participants stay focused.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20, filter: 'blur(16px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.08 }}
              className="relative"
            >
              <div className="paper-surface relative overflow-hidden rounded-[32px] border border-[rgba(26,23,20,0.08)] p-4 shadow-large sm:p-6">
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-accent/10 to-transparent" />
                <div className="relative rounded-[24px] border border-[rgba(26,23,20,0.08)] bg-[#fbf9f6] p-4 shadow-soft sm:p-5">
                  <div className="flex items-start justify-between gap-4 border-b section-divider pb-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Live session</p>
                      <h2 className="mt-2 text-2xl">Quarterly product review</h2>
                    </div>
                    <div className="rounded-full border border-accent/15 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                      128 in room
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
                    <Card className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-secondary">Current poll</p>
                          <p className="mt-2 text-xl font-medium text-text-primary">What needs clarity before launch?</p>
                        </div>
                        <span className="realtime-pulse mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
                      </div>

                      <div className="mt-6 space-y-3">
                        {liveResults.map((option) => {
                          const selected = option.id === selectedOption;

                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setSelectedOption(option.id)}
                              className={`focus-ring w-full rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                                selected
                                  ? 'border-accent/20 bg-accent/8'
                                  : 'border-[rgba(26,23,20,0.07)] bg-white/80 hover:border-[rgba(26,23,20,0.12)]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-text-primary">{option.label}</span>
                                <span className="text-sm text-text-secondary">{option.percent}%</span>
                              </div>
                              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                                <motion.div
                                  className="h-full rounded-full bg-accent"
                                  animate={{ width: `${option.percent}%`, opacity: selected ? 1 : 0.68 }}
                                  transition={{ duration: 0.5, ease: 'easeOut' }}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </Card>

                    <div className="space-y-4">
                      <Card className="p-5">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-secondary">Response pulse</p>
                          <span className="text-sm text-text-secondary">+22%</span>
                        </div>
                        <div className="mt-4 h-36">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timelineData}>
                              <defs>
                                <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.24} />
                                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="label" hide />
                              <YAxis hide />
                              <Tooltip cursor={false} contentStyle={tooltipStyle} />
                              <Area
                                dataKey="responses"
                                type="monotone"
                                stroke="var(--accent)"
                                strokeWidth={2.4}
                                fill="url(#hero-area)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>

                      <Card className="p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-secondary">Facilitator notes</p>
                        <div className="mt-4 space-y-3 text-sm leading-6 text-text-secondary">
                          <div className="rounded-2xl bg-secondary/60 p-3">Questions are clustering around onboarding and next-step ownership.</div>
                          <div className="rounded-2xl bg-secondary/40 p-3">Responses are strongest after concise prompts and a 20-second pause.</div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </PageContainer>
      </section>

      <section className="border-y section-divider bg-white/30 py-10">
        <PageContainer>
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-text-secondary">
            Trusted by thoughtful teams running research, events, and learning at scale
          </p>
          <div className="mt-8 grid grid-cols-2 gap-5 text-center sm:grid-cols-3 lg:grid-cols-6">
            {['Northline', 'Aster', 'Kanso', 'Lattice', 'Studio M', 'Notion Labs'].map((name) => (
              <div
                key={name}
                className="rounded-2xl border border-[rgba(26,23,20,0.06)] bg-white/55 px-4 py-4 font-serif text-xl text-text-primary/75"
              >
                {name}
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      <section id="features" className="py-24 sm:py-28">
        <PageContainer>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Designed for flow</p>
              <h2 className="max-w-lg text-4xl leading-tight sm:text-5xl">A calmer interface for moments that move fast.</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-text-secondary sm:justify-self-end sm:text-lg">
              MaYu combines editorial spacing, subtle live motion, and minimal analytics so every interaction feels intentional. The product stays quiet while the room speaks.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {featureCards.map(({ title, description, icon: Icon }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.25, delay: index * 0.06, ease: 'easeOut' }}
              >
                <Card className="h-full p-7 hover:-translate-y-1 hover:shadow-medium">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-8 text-2xl">{title}</h3>
                  <p className="mt-4 text-base leading-7">{description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </PageContainer>
      </section>

      <section id="demo" className="border-y section-divider bg-white/40 py-24 sm:py-28">
        <PageContainer>
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Live demo</p>
              <h2 className="text-4xl leading-tight sm:text-5xl">Watch a poll shift as the room answers.</h2>
              <p className="max-w-xl text-base leading-7 text-text-secondary sm:text-lg">
                Click an answer and MaYu updates the story in place. No jumpy motion, no overloaded dashboard, just a readable live signal.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline">Realtime counters</Badge>
                <Badge variant="outline">Subtle interpolation</Badge>
                <Badge variant="outline">Distraction-free mobile flow</Badge>
              </div>
            </div>

            <Card className="overflow-hidden p-0">
              <div className="grid gap-0 md:grid-cols-[0.94fr_1.06fr]">
                <div className="border-b section-divider p-6 md:border-b-0 md:border-r">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-secondary">Prompt</p>
                  <h3 className="mt-3 text-3xl leading-tight">What should leadership clarify next?</h3>
                  <div className="mt-8 space-y-3">
                    {liveResults.map((option) => {
                      const selected = option.id === selectedOption;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedOption(option.id)}
                          className={`focus-ring w-full rounded-2xl border px-4 py-4 text-left ${
                            selected
                              ? 'border-accent/20 bg-accent/8'
                              : 'border-[rgba(26,23,20,0.07)] bg-white/70 hover:border-[rgba(26,23,20,0.12)]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-text-primary">{option.label}</span>
                            {selected ? <CheckCircle2 className="h-4 w-4 text-accent" /> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="paper-surface p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-secondary">Instant analysis</p>
                      <p className="mt-2 text-xl font-medium text-text-primary">Live response distribution</p>
                    </div>
                    <Badge variant="active">Updating</Badge>
                  </div>
                  <div className="mt-8 space-y-4">
                    {liveResults.map((option, index) => (
                      <div key={option.id}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-primary">{option.label}</span>
                          <span className="text-text-secondary">{option.percent}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                          <motion.div
                            className="h-full rounded-full bg-accent"
                            animate={{ width: `${option.percent}%`, opacity: 1 - index * 0.12 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    <Card className="p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-secondary">Active voters</p>
                      <p className="mt-3 font-serif text-4xl text-text-primary">128</p>
                    </Card>
                    <Card className="p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-secondary">Completion rate</p>
                      <p className="mt-3 font-serif text-4xl text-text-primary">92%</p>
                    </Card>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </PageContainer>
      </section>

      <section className="py-24 sm:py-28">
        <PageContainer>
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">How it works</p>
              <h2 className="text-4xl leading-tight sm:text-5xl">Built for the rhythm of live facilitation.</h2>
              <p className="text-base leading-7 text-text-secondary sm:text-lg">
                From setup to insight, each step stays lightweight so you can focus on the room instead of operating a dashboard.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                ['Compose', 'Shape the poll with flexible question blocks, autosave, and a live preview that mirrors the participant experience.'],
                ['Share', 'Open the poll instantly with a clean public page that feels calm on both phones and laptops.'],
                ['Read the room', 'See counters, response patterns, and participation shifts update smoothly as answers arrive.'],
              ].map(([title, copy], index) => (
                <Card key={title} className="h-full p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-serif text-lg text-text-primary">
                    {index + 1}
                  </div>
                  <h3 className="mt-8 text-2xl">{title}</h3>
                  <p className="mt-4 text-base leading-7">{copy}</p>
                </Card>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="border-y section-divider bg-white/38 py-24 sm:py-28">
        <PageContainer>
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Analytics showcase</p>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="max-w-3xl text-4xl leading-tight sm:text-5xl">Analytics that feel alive, not crowded.</h2>
              <p className="max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
                Response charts, trend movement, and participation snapshots stay readable even when the room moves quickly.
              </p>
            </div>
          </div>

          <Card className="mt-12 overflow-hidden p-0">
            <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="border-b section-divider p-6 sm:p-8 lg:border-b-0 lg:border-r">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Realtime participation</p>
                    <h3 className="mt-2 text-3xl">Signal over time</h3>
                  </div>
                  <Badge variant="active">Active poll</Badge>
                </div>
                <div className="mt-8 h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient id="landing-showcase" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.26} />
                          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis axisLine={false} tickLine={false} dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                      <Tooltip cursor={false} contentStyle={tooltipStyle} />
                      <Area
                        dataKey="responses"
                        type="monotone"
                        stroke="var(--accent)"
                        strokeWidth={2.5}
                        fill="url(#landing-showcase)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="paper-surface p-6 sm:p-8">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <Card className="p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Response total</p>
                    <p className="mt-3 font-serif text-4xl text-text-primary">2,418</p>
                    <p className="mt-2 text-sm">A steady climb after the prompt narrowed to one decision.</p>
                  </Card>
                  <Card className="p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Clarity breakdown</p>
                    <div className="mt-4 h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={segmentData} barCategoryGap="28%">
                          <XAxis axisLine={false} tickLine={false} dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                          <YAxis hide />
                          <Tooltip cursor={false} contentStyle={tooltipStyle} />
                          <Bar dataKey="value" fill="var(--accent)" radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </Card>
        </PageContainer>
      </section>

      <section className="py-24 sm:py-28">
        <PageContainer>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Testimonials</p>
              <h2 className="text-4xl leading-tight sm:text-5xl">Teams choose MaYu when the room matters.</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
              The strongest feedback keeps returning to the same theme: the product feels thoughtful enough to disappear into the work.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonials.map((item, index) => (
              <Card
                key={item.name}
                className={`p-7 ${index === 1 ? 'lg:translate-y-8' : ''}`}
              >
                <Sparkles className="h-5 w-5 text-accent" />
                <p className="mt-6 text-lg leading-8 text-text-primary">{item.quote}</p>
                <div className="mt-10">
                  <p className="font-medium text-text-primary">{item.name}</p>
                  <p className="text-sm">{item.title}</p>
                </div>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      <section id="pricing" className="border-y section-divider bg-white/40 py-24 sm:py-28">
        <PageContainer>
          <div className="space-y-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Pricing</p>
            <h2 className="text-4xl leading-tight sm:text-5xl">Simple plans for calm, high-signal sessions.</h2>
            <p className="mx-auto max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
              Start small, then move into full realtime facilitation when your sessions and team grow.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`p-8 ${tier.highlighted ? 'border-accent/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,247,244,0.92))]' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">{tier.name}</p>
                    <p className="mt-3 font-serif text-5xl text-text-primary">
                      {tier.price}
                      <span className="ml-2 text-lg text-text-secondary">{tier.name === 'Pro' ? '/ month' : ''}</span>
                    </p>
                  </div>
                  {tier.highlighted ? <Badge variant="active">Recommended</Badge> : null}
                </div>
                <p className="mt-5 max-w-xl text-base leading-7">{tier.description}</p>
                <div className="mt-8 space-y-3">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 text-sm leading-6 text-text-primary">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="mt-10">
                  <Link to="/signup">
                    <Button variant={tier.highlighted ? 'primary' : 'outline'} className="w-full sm:w-auto">
                      {tier.highlighted ? 'Start Pro' : 'Start Free'}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="py-24">
        <PageContainer size="reading">
          <Card className="overflow-hidden p-0">
            <div className="paper-surface relative p-8 text-center sm:p-12">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-accent/10 to-transparent" />
              <div className="relative">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Start now</p>
                <h2 className="mx-auto mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">
                  From question to clarity, in real time.
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
                  Build your first poll in minutes, share it instantly, and watch the room respond with analytics designed to stay calm under pressure.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link to="/signup">
                    <Button size="lg">
                      Launch your first poll
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a href="#features">
                    <Button size="lg" variant="outline">
                      Explore the product
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </PageContainer>
      </section>

      <footer id="docs" className="border-t section-divider py-14">
        <PageContainer>
          <div className="grid gap-10 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(26,23,20,0.08)] bg-white/80 text-accent">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-serif text-2xl text-text-primary">MaYu</p>
                  <p className="text-sm">Crafted for realtime clarity.</p>
                </div>
              </div>
              <p className="mt-6 max-w-md text-sm leading-7">
                Elegant live polls, calm analytics, and a Japanese-inspired interface for teams that want better signal from the room.
              </p>
            </div>

            {[
              { title: 'Product', links: ['Features', 'Live demo', 'Pricing', 'Changelog'] },
              { title: 'Resources', links: ['Docs', 'Guides', 'Support', 'API'] },
              { title: 'Company', links: ['About', 'Contact', 'Careers', 'Privacy'] },
            ].map((group) => (
              <div key={group.title}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">{group.title}</p>
                <div className="mt-5 space-y-3">
                  {group.links.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-text-primary">
                      <ChevronRight className="h-4 w-4 text-text-secondary" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PageContainer>
      </footer>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: '18px',
  border: '1px solid rgba(26, 23, 20, 0.08)',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  boxShadow: 'var(--shadow-medium)',
};
