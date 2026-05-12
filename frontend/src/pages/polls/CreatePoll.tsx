import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Control, UseFormRegister, UseFormSetValue, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlignLeft,
  ArrowRight,
  CheckCircle2,
  GripVertical,
  ListOrdered,
  Plus,
  Settings2,
  Star,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/axios';
import { ProductShell } from '@/components/layout/ProductShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/utils';

const optionSchema = z.object({
  text: z.string().min(1, 'Option text is required'),
});

const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  type: z.enum(['MULTIPLE_CHOICE', 'RATING', 'TEXT', 'RANKING']),
  isMandatory: z.boolean(),
  options: z.array(optionSchema),
}).superRefine((question, ctx) => {
  if ((question.type === 'MULTIPLE_CHOICE' || question.type === 'RANKING') && question.options.length < 2) {
    ctx.addIssue({
      code: 'custom',
      path: ['options'],
      message: 'Multiple choice and ranking questions need at least 2 options',
    });
  }
});

const pollSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  isAnonymous: z.boolean(),
  requiresAuth: z.boolean(),
  expiresAt: z.string().optional().nullable(),
  questions: z.array(questionSchema).min(1, 'At least 1 question required'),
});

type PollFormValues = z.infer<typeof pollSchema>;
type QuestionTypeId = PollFormValues['questions'][number]['type'];

const questionTypes: Array<{ id: QuestionTypeId; label: string; description: string; icon: typeof CheckCircle2 }> = [
  {
    id: 'MULTIPLE_CHOICE',
    label: 'Multiple choice',
    description: 'Fast signal with one clear answer path.',
    icon: CheckCircle2,
  },
  {
    id: 'RATING',
    label: 'Rating',
    description: 'Measure confidence or satisfaction quickly.',
    icon: Star,
  },
  {
    id: 'TEXT',
    label: 'Text',
    description: 'Open feedback for nuance and follow-up.',
    icon: AlignLeft,
  },
  {
    id: 'RANKING',
    label: 'Ranking',
    description: 'Help participants prioritize what matters most.',
    icon: ListOrdered,
  },
];

const questionTypeLabels: Record<QuestionTypeId, string> = {
  MULTIPLE_CHOICE: 'Multiple choice',
  RATING: 'Rating',
  TEXT: 'Text',
  RANKING: 'Ranking',
};

const questionTypeIcons: Record<QuestionTypeId, typeof CheckCircle2> = {
  MULTIPLE_CHOICE: CheckCircle2,
  RATING: Star,
  TEXT: AlignLeft,
  RANKING: ListOrdered,
};

const getDefaultOptions = (type: QuestionTypeId) => {
  if (type === 'TEXT' || type === 'RATING') {
    return [];
  }

  return [{ text: '' }, { text: '' }];
};

const getStarterQuestion = (type: QuestionTypeId): PollFormValues['questions'][number] => ({
  text: '',
  type,
  isMandatory: true,
  options: getDefaultOptions(type),
});

export function CreatePoll() {
  const navigate = useNavigate();
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PollFormValues>({
    resolver: zodResolver(pollSchema),
    defaultValues: {
      title: 'Untitled session',
      description: '',
      isAnonymous: true,
      requiresAuth: false,
      expiresAt: '',
      questions: [
        {
          text: 'What should we clarify before moving forward?',
          type: 'MULTIPLE_CHOICE',
          isMandatory: true,
          options: [{ text: 'Goals and scope' }, { text: 'Ownership and next steps' }, { text: 'Timeline and pacing' }],
        },
      ],
    },
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'questions',
  });

  const values = watch();
  const activeQuestion = values.questions[activeQuestionIndex];
  const answeredPreview = values.questions.filter((question) => question.text.trim().length > 0).length;

  const onSubmit = async (data: PollFormValues) => {
    try {
      const questions = data.questions.map((question) => ({
        ...question,
        options:
          question.type === 'TEXT' || question.type === 'RATING'
            ? []
            : question.options.filter((option) => option.text.trim().length > 0),
      }));

      const response = await api.post('/polls', {
        ...data,
        questions,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      });

      if (response.data.success) {
        toast.success('Poll launched successfully.');
        navigate('/dashboard');
      }
    } catch (requestError: unknown) {
      toast.error('Unable to create poll right now.');
    }
  };

  return (
    <ProductShell
      eyebrow="Poll builder"
      title={values.title || 'Untitled session'}
      description="Compose the poll on the left, keep the respondent preview visible on the right, and tune the response flow without leaving the page."
      actions={
        <>
          <div className="hidden rounded-full border border-[rgba(26,23,20,0.08)] bg-white/70 px-4 py-2 text-sm text-text-secondary sm:flex">
            Autosave concept ready
          </div>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>
            Launch poll
            <ArrowRight className="h-4 w-4" />
          </Button>
        </>
      }
    >
      <div className="grid gap-6 pb-24 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
        <div className="space-y-6">
          <Card className="p-6 sm:p-7">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <Input label="Poll title" {...register('title')} error={errors.title?.message} />
              </div>
              <div className="lg:col-span-2">
                <Textarea label="Description" {...register('description')} placeholder="Set context for participants before they answer." />
              </div>
              <Input label="Expiration time" type="datetime-local" {...register('expiresAt')} />
              <div className="rounded-[18px] border border-[rgba(26,23,20,0.08)] bg-secondary/40 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-secondary">Session settings</p>
                <div className="mt-4 space-y-4">
                  <Toggle
                    label="Anonymous responses"
                    description="Hide participant identities while keeping the aggregate signal."
                    checked={values.isAnonymous}
                    onCheckedChange={(checked) => setValue('isAnonymous', checked)}
                  />
                  <Toggle
                    label="Require account sign-in"
                    description="Best for internal sessions or small invited groups."
                    checked={values.requiresAuth}
                    onCheckedChange={(checked) => setValue('requiresAuth', checked)}
                  />
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Questions</p>
                  <h2 className="mt-2 text-2xl">Structure the flow</h2>
                </div>
                <Badge variant="outline">{questionFields.length} total</Badge>
              </div>

              <div className="mt-6 space-y-2">
                {questionFields.map((field, index) => (
                  <QuestionListItem
                    key={field.id}
                    index={index}
                    question={values.questions[index]}
                    isActive={activeQuestionIndex === index}
                    canRemove={questionFields.length > 1}
                    onSelect={() => setActiveQuestionIndex(index)}
                    onRemove={() => {
                      removeQuestion(index);
                      setActiveQuestionIndex((currentIndex) => Math.max(0, Math.min(currentIndex, questionFields.length - 2)));
                    }}
                  />
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t section-divider pt-5">
                {questionTypes.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      appendQuestion(getStarterQuestion(id));
                      setActiveQuestionIndex(questionFields.length);
                    }}
                    className="focus-ring flex w-full items-center gap-3 rounded-2xl border border-[rgba(26,23,20,0.06)] bg-white/70 px-4 py-3 text-left hover:border-[rgba(26,23,20,0.12)]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-secondary text-text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{label}</p>
                      <p className="text-xs text-text-secondary">Add this format</p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Editing question {activeQuestionIndex + 1}</p>
                  <h2 className="mt-2 text-2xl">Refine the prompt</h2>
                </div>
                <Badge variant="outline">{activeQuestion?.type.replace('_', ' ')}</Badge>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {questionTypes.map(({ id, label, description, icon: Icon }) => {
                  const active = activeQuestion?.type === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setValue(`questions.${activeQuestionIndex}.type`, id);
                        setValue(`questions.${activeQuestionIndex}.options`, getDefaultOptions(id));
                      }}
                      className={cn(
                        'focus-ring rounded-2xl border px-4 py-4 text-left',
                        active ? 'border-accent/18 bg-accent/8' : 'border-[rgba(26,23,20,0.06)] bg-white/75'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', active ? 'bg-accent/12 text-accent' : 'bg-secondary text-text-primary')}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{label}</p>
                          <p className="text-xs leading-5 text-text-secondary">{description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 space-y-5">
                <Input
                  label="Question prompt"
                  {...register(`questions.${activeQuestionIndex}.text`)}
                  error={errors.questions?.[activeQuestionIndex]?.text?.message}
                />

                {activeQuestion?.type === 'MULTIPLE_CHOICE' || activeQuestion?.type === 'RANKING' ? (
                  <OptionEditor
                    activeQuestionIndex={activeQuestionIndex}
                    control={control}
                    register={register}
                    setValue={setValue}
                    values={values}
                    helperText={
                      activeQuestion.type === 'RANKING'
                        ? 'Participants will rank these options from highest to lowest priority.'
                        : 'Participants will select one of these options.'
                    }
                  />
                ) : (
                  <QuestionTypeConfig type={activeQuestion?.type ?? 'MULTIPLE_CHOICE'} />
                )}

                <div className="rounded-[18px] border border-[rgba(26,23,20,0.08)] bg-secondary/35 p-4">
                  <Toggle
                    label="Required question"
                    description="Participants must answer this before they can submit."
                    checked={values.questions[activeQuestionIndex]?.isMandatory ?? true}
                    onCheckedChange={(checked) => setValue(`questions.${activeQuestionIndex}.isMandatory`, checked)}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="xl:sticky xl:top-[112px]">
          <Card className="overflow-hidden p-0">
            <div className="border-b section-divider p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Respondent preview</p>
                  <h2 className="mt-2 text-2xl">How the poll will feel</h2>
                </div>
                <Badge variant="active">{answeredPreview} ready</Badge>
              </div>
            </div>

            <div className="paper-surface p-6 sm:p-7">
              <div className="rounded-[22px] border border-[rgba(26,23,20,0.07)] bg-white/88 p-6 shadow-soft">
                <div className="flex items-center justify-between border-b section-divider pb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Live poll preview</p>
                    <h3 className="mt-2 text-3xl">{values.title}</h3>
                  </div>
                  <Badge variant="outline">{values.questions.length} questions</Badge>
                </div>

                {values.description ? <p className="mt-5 text-base leading-7">{values.description}</p> : null}

                <div className="mt-8">
                  <div className="mb-5 flex items-center justify-between text-sm text-text-secondary">
                    <span>
                      Question {activeQuestionIndex + 1} of {values.questions.length}
                    </span>
                    <span>{Math.round(((activeQuestionIndex + 1) / values.questions.length) * 100)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${((activeQuestionIndex + 1) / values.questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-8 space-y-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Current prompt</p>
                    <h4 className="mt-3 text-2xl leading-tight">
                      {activeQuestion?.text || 'Write a prompt to see it here.'}
                    </h4>
                  </div>

                  <PreviewAnswer question={activeQuestion} />

                  <div className="rounded-[18px] border border-[rgba(26,23,20,0.08)] bg-secondary/35 p-4">
                    <div className="flex items-start gap-3">
                      <Settings2 className="mt-0.5 h-4 w-4 text-text-secondary" />
                      <div className="space-y-1 text-sm leading-6">
                        <p className="text-text-primary">{values.requiresAuth ? 'Participants must sign in.' : 'Participants can answer instantly.'}</p>
                        <p>{values.isAnonymous ? 'Responses will be anonymous.' : 'Responses may be attributable.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ProductShell>
  );
}

function QuestionListItem({
  index,
  question,
  isActive,
  canRemove,
  onSelect,
  onRemove,
}: {
  index: number;
  question?: PollFormValues['questions'][number];
  isActive: boolean;
  canRemove: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const type = question?.type ?? 'MULTIPLE_CHOICE';
  const Icon = questionTypeIcons[type];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'focus-ring flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all',
        isActive
          ? 'border-accent/20 bg-accent/8'
          : 'border-[rgba(26,23,20,0.06)] bg-white/70 hover:border-[rgba(26,23,20,0.12)]'
      )}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-text-secondary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-5 text-text-primary">
          {index + 1}. {question?.text || 'Untitled question'}
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-text-secondary">
          {questionTypeLabels[type]}
        </p>
      </div>
      {canRemove ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="focus-ring rounded-full p-1 text-text-secondary hover:bg-white hover:text-text-primary"
          aria-label={`Remove question ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function OptionEditor({
  activeQuestionIndex,
  control,
  register,
  setValue,
  values,
  helperText,
}: {
  activeQuestionIndex: number;
  control: Control<PollFormValues>;
  register: UseFormRegister<PollFormValues>;
  setValue: UseFormSetValue<PollFormValues>;
  values: PollFormValues;
  helperText: string;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${activeQuestionIndex}.options`,
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Answer options</p>
          <p className="mt-2 text-sm">{helperText}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => append({ text: '' })}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add option
        </Button>
      </div>

      <div className="space-y-3">
        {fields.map((field, optionIndex) => (
          <div key={field.id} className="flex items-center gap-3 rounded-2xl border border-[rgba(26,23,20,0.06)] bg-white/75 px-4 py-3">
            <GripVertical className="h-4 w-4 shrink-0 text-text-secondary" />
            <input
              {...register(`questions.${activeQuestionIndex}.options.${optionIndex}.text`)}
              placeholder={`Option ${optionIndex + 1}`}
              className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary/45"
            />
            {fields.length > 2 ? (
              <button
                type="button"
                onClick={() => {
                  remove(optionIndex);
                  if (values.questions[activeQuestionIndex].options.length === 2) {
                    setValue(`questions.${activeQuestionIndex}.isMandatory`, true);
                  }
                }}
                className="focus-ring rounded-full p-1 text-text-secondary hover:bg-secondary hover:text-text-primary"
                aria-label={`Remove option ${optionIndex + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionTypeConfig({ type }: { type: QuestionTypeId }) {
  if (type === 'RATING') {
    return (
      <div className="rounded-[18px] border border-[rgba(26,23,20,0.08)] bg-white/70 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Rating scale</p>
            <p className="mt-2 text-sm leading-6">Respondents will choose a score from 1 to 5 stars.</p>
          </div>
          <div className="flex gap-1 text-accent">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Star key={rating} className="h-5 w-5 fill-current" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'TEXT') {
    return (
      <div className="rounded-[18px] border border-[rgba(26,23,20,0.08)] bg-white/70 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">Written response</p>
        <p className="mt-2 text-sm leading-6">Respondents will get a spacious text area for open feedback.</p>
      </div>
    );
  }

  return null;
}

function PreviewAnswer({ question }: { question?: PollFormValues['questions'][number] }) {
  if (!question) {
    return null;
  }

  if (question.type === 'TEXT') {
    return (
      <div className="rounded-2xl border border-[rgba(26,23,20,0.06)] bg-white/75 px-4 py-4">
        <div className="h-24 rounded-xl border border-dashed border-[rgba(26,23,20,0.16)] bg-secondary/35 px-4 py-3 text-sm text-text-secondary">
          Type your response...
        </div>
      </div>
    );
  }

  if (question.type === 'RATING') {
    return (
      <div className="flex gap-2 rounded-2xl border border-[rgba(26,23,20,0.06)] bg-white/75 px-4 py-4">
        {[1, 2, 3, 4, 5].map((rating) => (
          <Star key={rating} className="h-7 w-7 text-accent" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {question.options.map((option, index) => (
        <div
          key={`${option.text}-${index}`}
          className="rounded-2xl border border-[rgba(26,23,20,0.06)] bg-white/75 px-4 py-4"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[rgba(26,23,20,0.18)]">
              {question.type === 'RANKING' ? <span className="text-[10px] text-text-secondary">{index + 1}</span> : null}
            </span>
            <span className="text-sm text-text-primary">{option.text || `Option ${index + 1}`}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
