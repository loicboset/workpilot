import { now, today } from '@internationalized/date'
import { useTranslation } from 'react-i18next'
import { formatDay } from '@/lib/format'

/** "Good morning, Loïc", today's date, and a circle to breathe with. */
export function Greeting({ firstName, timeZone }: { firstName: string; timeZone: string }) {
  const { t, i18n } = useTranslation()
  const hour = now(timeZone).hour
  const partOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'

  return (
    <div className="flex items-center gap-4">
      <span className="relative size-12 shrink-0" aria-hidden>
        <span className="absolute inset-0 rounded-full bg-grove-moss-soft motion-safe:animate-breathe" />
        <span className="absolute inset-3.5 rounded-full bg-grove-moss/60" />
      </span>
      <div>
        <h1 className="font-serif text-3xl text-grove-ink">
          {t(`home.greeting.${partOfDay}`, { name: firstName })}
        </h1>
        <p className="text-sm text-grove-muted first-letter:uppercase">
          {formatDay(today(timeZone), i18n.language, timeZone)} · {t('home.breathe')}
        </p>
      </div>
    </div>
  )
}
