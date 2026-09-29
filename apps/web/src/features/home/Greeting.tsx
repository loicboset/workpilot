import { today } from '@internationalized/date'
import { useTranslation } from 'react-i18next'
import { formatDay } from '@/lib/format'

type GreetingProps = { firstName: string; timeZone: string }

/** "Hi Loïc,", today's date, and a circle to breathe with. */
export const Greeting = ({ firstName, timeZone }: GreetingProps) => {
  // HOOKS
  const { t, i18n } = useTranslation()

  return (
    <div className="flex items-center gap-4.5">
      {/* At rest (and without motion) it keeps the breath's first frame: small and light. */}
      <span
        aria-hidden
        className="size-14 shrink-0 rounded-full bg-radial-[at_40%_20%] from-grove-breath to-grove-breath-deep opacity-55 motion-safe:animate-breathe motion-reduce:scale-72"
      />
      <div className="min-w-0">
        <h1 className="pb-0.75 font-serif text-[34px] leading-9.5 font-medium text-grove-ink">
          {t('home.greeting', { name: firstName })}
        </h1>
        <p className="text-[15px] leading-4.5 text-grove-muted first-letter:uppercase">
          {formatDay(today(timeZone), i18n.language, timeZone)} · {t('home.breathe')}
        </p>
      </div>
    </div>
  )
}
