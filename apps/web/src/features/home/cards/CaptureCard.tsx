import { today } from '@internationalized/date'
import { Feather } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ListBoxItem } from '@/components/ui/ListBoxItem'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { useTimeZone } from '@/data/profile'
import { CapturePreview } from '@/features/capture/CapturePreview'
import { parseCapture, type Command } from '@/features/capture/parseCapture'
import { saveCapture } from '@/features/capture/saveCapture'

type FileUnder = Extract<Command, 'idea' | 'todo'>

/** "Empty your mind": write it down, file it as an idea or a todo. Commands work here too. */
export function CaptureCard() {
  const { t } = useTranslation()
  const timeZone = useTimeZone()
  const [text, setText] = useState('')
  const [fileUnder, setFileUnder] = useState<FileUnder>('idea')
  const [isSaved, setSaved] = useState(false)
  const hasCommand = text.trim().startsWith('/')
  const result = parseCapture(hasCommand ? text : `/${fileUnder} ${text}`, today(timeZone))

  async function save() {
    if (!('capture' in result)) return
    await saveCapture(result.capture, timeZone)
    setText('')
    setSaved(true)
  }

  return (
    <Card title={t('home.capture.title')} subtitle={t('home.capture.subtitle')} icon={<Feather />}>
      <div className="space-y-4">
        <TextField
          aria-label={t('home.capture.fieldLabel')}
          placeholder={t('capture.placeholder')}
          value={text}
          onChange={(value) => {
            setText(value)
            setSaved(false)
          }}
          multiline
        />
        {isSaved ? (
          <Alert tone="success">{t('home.capture.saved')}</Alert>
        ) : (
          text.trim() && <CapturePreview result={result} timeZone={timeZone} />
        )}
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label={t('home.capture.fileUnder')}
            selectedKey={fileUnder}
            onSelectionChange={(key) => setFileUnder(key as FileUnder)}
            isDisabled={hasCommand}
            className="min-w-40"
          >
            <ListBoxItem id="idea">{t('capture.kinds.idea')}</ListBoxItem>
            <ListBoxItem id="todo">{t('capture.kinds.todo')}</ListBoxItem>
          </Select>
          <Button
            className="ml-auto"
            onPress={() => void save()}
            isDisabled={!('capture' in result)}
          >
            {t('home.capture.save')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
