/**
 * A todo's priority (ADR 0030): 1 is the most important, 3 the least; `null` is none.
 * Typed in the capture bar as !1, !2 or !3.
 */

export const PRIORITIES = [1, 2, 3] as const
export type Priority = (typeof PRIORITIES)[number]

// Sorts after every priority.
const NONE = PRIORITIES.length + 1

export const isPriority = (value: unknown): value is Priority =>
  PRIORITIES.some((priority) => priority === value)

/** Most important first, none last. Rows saved before priorities existed have none. */
export const byPriority = (a: Priority | null | undefined, b: Priority | null | undefined) =>
  (a ?? NONE) - (b ?? NONE)

/** The next priority when pressed again and again: none, 1, 2, 3, none… */
export const nextPriority = (priority: Priority | null): Priority | null =>
  priority === null ? PRIORITIES[0] : (PRIORITIES.find((next) => next > priority) ?? null)
