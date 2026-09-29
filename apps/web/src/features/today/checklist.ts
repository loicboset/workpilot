/** A checklist line in a todo's notes, as in Markdown: "- [ ] step" or "- [x] step". */
const CHECKLIST_LINE = /^\s*[-*]\s+\[([ xX])\]/

/** How many checklist lines the notes have, and how many are ticked. `null` without any. */
export const checklistProgress = (notes: string | null): { done: number; total: number } | null => {
  const marks = (notes ?? '')
    .split('\n')
    .map((line) => CHECKLIST_LINE.exec(line)?.[1])
    .filter((mark) => mark !== undefined)
  if (marks.length === 0) return null
  return { done: marks.filter((mark) => mark !== ' ').length, total: marks.length }
}
