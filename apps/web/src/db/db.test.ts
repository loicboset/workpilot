import Dexie from 'dexie'
import { beforeEach, expect, it } from 'vitest'
import { CURSOR_KEY, db } from './db'

beforeEach(async () => {
  db.close()
  await Dexie.delete('workpilot')
})

it('pulls everything again once spaces arrive, keeping edits waiting to be pushed', async () => {
  // A browser from before spaces: version 2, a cursor past the `spaces` rows it skipped.
  const before = new Dexie('workpilot')
  before.version(1).stores({ meta: 'key' })
  before.version(2).stores({ todos: 'id, due_date, milestone_id', outbox: '[table+id]' })
  await before.open()
  await before.table('meta').put({ key: CURSOR_KEY, value: 42 })
  await before.table('todos').put({ id: 't1', title: 'Edited offline' })
  await before.table('outbox').put({ table: 'todos', id: 't1', change_id: 'c1' })
  before.close()

  await db.open()

  expect(await db.meta.get(CURSOR_KEY)).toBeUndefined()
  expect(await db.outbox.get(['todos', 't1'])).toBeDefined()
  expect((await db.todos.get('t1'))?.title).toBe('Edited offline')
})
