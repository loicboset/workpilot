import { Info } from 'lucide-react'
import { DialogTrigger } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { Dialog } from './ui/Modal'
import { IconButton } from './ui/IconButton'
import { Link } from './ui/Link'
import { Popover } from './ui/Popover'

/** The methods WorkPilot is built on (docs/methodologies). Texts are in the translations. */
const METHOD_SOURCES = {
  hoshinKanri:
    'https://blog.kainexus.com/improvement-disciplines/hoshin-kanri/how-to-use-the-hoshin-kanri-x-matrix-to-deploy-your-strategic-plan',
} as const

export type MethodId = keyof typeof METHOD_SOURCES

/** The ⓘ next to a feature built on a method: what it is and how WorkPilot applies it (ADR 0014). */
export function MethodInfo({ method }: { method: MethodId }) {
  const { t } = useTranslation()
  const name = t(`methods.${method}.name`)
  return (
    <DialogTrigger>
      <IconButton aria-label={t('methods.about', { name })} size="sm">
        <Info />
      </IconButton>
      <Popover className="max-w-sm p-5">
        <Dialog aria-label={name} className="space-y-3 text-sm leading-6">
          <p className="text-xs font-semibold tracking-wider text-grove-moss uppercase">
            {t('methods.label')}
          </p>
          <div>
            <p className="font-serif text-lg text-grove-ink">{name}</p>
            <p className="text-grove-muted">{t(`methods.${method}.origin`)}</p>
          </div>
          <Section title={t('methods.applied')}>{t(`methods.${method}.applied`)}</Section>
          <Section title={t('methods.adapted')}>{t(`methods.${method}.adapted`)}</Section>
          <Link href={METHOD_SOURCES[method]} target="_blank" rel="noreferrer">
            {t('methods.learnMore')}
          </Link>
        </Dialog>
      </Popover>
    </DialogTrigger>
  )
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <p className="font-semibold text-grove-ink">{title}</p>
      <p className="text-grove-muted">{children}</p>
    </div>
  )
}
