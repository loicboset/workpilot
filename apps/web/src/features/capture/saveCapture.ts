import { addIdea } from '@/data/ideas'
import { addTimeBlock } from '@/data/timeBlocks'
import { addTodo } from '@/data/todos'
import { momentOf } from '@/lib/dates'
import type { Capture } from './parseCapture'

/** Save what the capture bar understood, on this device first (synced later). */
export async function saveCapture(capture: Capture, timeZone: string): Promise<void> {
  switch (capture.kind) {
    case 'todo':
      await addTodo({ title: capture.title, due_date: capture.dueDate?.toString() ?? null })
      return
    case 'block':
      await addTimeBlock({
        title: capture.title,
        start_at: momentOf(capture.day, capture.start, timeZone),
        end_at: momentOf(capture.day, capture.end, timeZone),
      })
      return
    case 'idea':
      await addIdea(capture.text)
      return
  }
}
