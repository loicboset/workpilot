import { Lightbulb, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { IconButton } from '@/components/ui/IconButton'
import { useIdeas, deleteIdea } from '@/data/ideas'
import { openCaptureBar } from '@/features/capture/captureStore'

const SHOWN = 6

/** Ideas captured along the way: seeds to look at later (Opportunities, v0.3). */
export function IdeasCard() {
  const { t } = useTranslation()
  const ideas = useIdeas() ?? []

  return (
    <Card
      title={t('home.ideas.title')}
      subtitle={t('home.ideas.summary', { count: ideas.length })}
      icon={<Lightbulb />}
      actions={
        <IconButton
          size="sm"
          variant="secondary"
          aria-label={t('home.ideas.add')}
          onPress={openCaptureBar}
        >
          <Plus />
        </IconButton>
      }
    >
      {ideas.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-grove-muted">{t('home.ideas.empty')}</p>
          <Button size="sm" variant="secondary" onPress={openCaptureBar}>
            {t('home.ideas.add')}
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-grove-line">
          {ideas.slice(0, SHOWN).map((idea) => (
            <li key={idea.id} className="flex items-start gap-2 py-2">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-grove-clay" />
              <p className="flex-1 text-[15px] text-grove-ink">{idea.text}</p>
              <IconButton
                size="sm"
                aria-label={t('home.ideas.delete', { text: idea.text })}
                onPress={() => void deleteIdea(idea.id)}
              >
                <Trash2 />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
