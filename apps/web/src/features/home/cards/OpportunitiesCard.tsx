import { useTranslation } from 'react-i18next'
import { tv } from 'tailwind-variants'
import { OPPORTUNITIES } from '../demoData'
import { HomeCard } from '../HomeCard'
import { FutureLink } from './FutureLink'

/** A seedling: a stem and two leaves, drawn like the lucide icons. */
const SproutIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M11.75 20.75V11.5" />
    <path d="M11.5 12Q9.8 6.4 4.5 7.9Q6.2 12.6 11.5 12Z" />
    <path d="M11.5 10.5Q13.1 3.2 20.5 3.1Q18.9 10.3 11.5 10.5Z" />
  </svg>
)

const tagStyles = tv({
  base: 'shrink-0 rounded-full px-2.5 text-xs leading-5 font-bold',
  variants: {
    tone: {
      moss: 'bg-grove-moss-soft text-grove-moss',
      sky: 'bg-grove-sky text-grove-sky-ink',
    },
  },
})

/** Seeds the AI noticed in your captures, to plant as small experiments (v0.3, ADR 0008). */
export const OpportunitiesCard = () => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <HomeCard
      title={t('home.opportunities.title')}
      aside={t('home.opportunities.subtitle')}
      icon={<SproutIcon />}
      tone="sand"
      footer={
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <FutureLink arrow={false} className="text-sm">
            {t('home.opportunities.plant')}
          </FutureLink>
          <FutureLink arrow={false} tone="quiet" className="text-sm">
            {t('home.opportunities.rest')}
          </FutureLink>
        </div>
      }
    >
      <ul className="space-y-2.5">
        {OPPORTUNITIES.map((opportunity) => (
          <li
            key={opportunity.title}
            className="flex items-start gap-3 rounded-[20px] border border-grove-line bg-grove-card px-4 py-3.5"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[15px] leading-5 font-semibold text-grove-ink">
                {opportunity.title}
              </p>
              <p className="mt-1.25 text-[13px] leading-4 text-grove-muted">{opportunity.reason}</p>
            </div>
            <span className={tagStyles({ tone: opportunity.tone })}>{opportunity.tag}</span>
          </li>
        ))}
      </ul>
    </HomeCard>
  )
}
