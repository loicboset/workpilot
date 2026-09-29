import { addIdea } from '@/data/ideas'
import { addNote } from '@/data/notes'
import { addTimeBlock } from '@/data/timeBlocks'
import { addTodo } from '@/data/todos'
import { momentOf } from '@/lib/dates'
import type { Capture } from './parseCapture'

/** Save what the capture bar understood in the space, on this device first (synced later). */
export async function saveCapture(
  capture: Capture,
  spaceId: string,
  timeZone: string,
): Promise<void> {
  switch (capture.kind) {
    case 'todo':
      await addTodo(spaceId, {
        title: capture.title,
        due_date: capture.dueDate.toString(),
        priority: capture.priority,
      })
      return
    case 'icebox':
      await addTodo(spaceId, { title: capture.title, due_date: null, priority: capture.priority })
      return
    case 'block':
      await addTimeBlock(spaceId, {
        title: capture.title,
        start_at: momentOf(capture.day, capture.start, timeZone),
        end_at: momentOf(capture.day, capture.end, timeZone),
      })
      return
    case 'idea':
      await addIdea(spaceId, capture.text)
      return
    case 'note':
      await addNote(spaceId, capture.text)
      return
  }
}
