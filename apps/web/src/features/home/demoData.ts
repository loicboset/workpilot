/**
 * Placeholder content for the homepage cards whose features aren't built yet, as in the Grove
 * concept: this season's focus, the weekly review's time (v0.2), opportunities (v0.3) and learning
 * (v0.4). Replace each part with its repository when the feature ships, don't extend it.
 */

export type SeasonFocus = { title: string; detail: string }

export const SEASON_FOCUS: SeasonFocus[] = [
  { title: 'Ship the AI platform MVP', detail: 'One real use case, loved by one team' },
  { title: "Grow the team's autonomy", detail: 'Delegate decisions, not just tasks' },
  { title: 'Protect thinking time', detail: 'Two quiet mornings a week' },
]

export type WeeklyReview = {
  /** ISO weekday: 1 is Monday, 5 is Friday. */
  weekday: number
  hour: number
  minute: number
  minutes: number
}

export const WEEKLY_REVIEW: WeeklyReview = {
  weekday: 5,
  hour: 16,
  minute: 30,
  minutes: 15,
}

export type OpportunityTone = 'moss' | 'sky'

export type Opportunity = { title: string; reason: string; tag: string; tone: OpportunityTone }

export const OPPORTUNITIES: Opportunity[] = [
  {
    title: 'Automate the weekly HR metrics report',
    reason: '"Manual reporting" appeared in 3 of your captures.',
    tag: 'Quick win',
    tone: 'moss',
  },
  {
    title: 'AI pair-review for junior devs',
    reason: 'Connects to direction ii.',
    tag: 'Grows the team',
    tone: 'sky',
  },
]

export type Learning = {
  course: string
  lessonsDone: number
  lessonsTotal: number
  nextLessonMinutes: number
  read: { title: string; minutes: number }
  nightstand: string
}

export const LEARNING: Learning = {
  course: 'Evaluating LLM features in production',
  lessonsDone: 4,
  lessonsTotal: 10,
  nextLessonMinutes: 12,
  read: { title: 'Designing guardrails for AI features', minutes: 9 },
  nightstand: "The Manager's Path",
}
