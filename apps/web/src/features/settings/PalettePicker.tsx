import { Check } from 'lucide-react'
import { Radio, RadioGroup } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { tv } from 'tailwind-variants'
import { Description, Label } from '@/components/ui/Field'
import { Spinner } from '@/components/ui/Spinner'
import { savePalette, usePalette } from '@/data/profile'
import { focusRing } from '@/lib/styles'
import { isPalette, PALETTES, type Palette } from '@/lib/theme'

const optionStyles = tv({
  extend: focusRing,
  base: 'flex cursor-pointer flex-col gap-2 rounded-control p-1.5 ring-grove-moss transition-colors',
  variants: {
    isSelected: {
      true: 'ring-2',
      false: 'hovered:bg-grove-field',
    },
  },
})

/** Grove, Lake, Heather…: each shown in its own colours, saved and shown as soon as it's picked. */
export const PalettePicker = () => {
  // HOOKS
  const { t } = useTranslation()
  const palette = usePalette()

  // METHODS
  const pick = (value: string) => {
    if (isPalette(value)) void savePalette(value)
  }

  if (!palette) return <Spinner label={t('common.loading')} />

  return (
    <RadioGroup
      value={palette}
      onChange={pick}
      orientation="horizontal"
      className="flex flex-col gap-1.5"
    >
      <Label>{t('settings.appearance.palette')}</Label>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {PALETTES.map((option) => (
          <Radio key={option} value={option} className={optionStyles}>
            {({ isSelected }) => (
              <>
                <PalettePreview palette={option} />
                <span className="flex items-center justify-center gap-1 text-sm font-medium text-grove-ink">
                  {isSelected && (
                    <Check className="size-3.5 shrink-0 text-grove-moss" aria-hidden />
                  )}
                  {t(`settings.appearance.palettes.${option}`)}
                </span>
              </>
            )}
          </Radio>
        ))}
      </div>
      <Description>{t('settings.appearance.paletteHelp')}</Description>
    </RadioGroup>
  )
}

type PalettePreviewProps = { palette: Palette }

/**
 * A tiny page in the palette's colours, light or dark like the page itself: its own
 * `data-palette` gives it that palette's tokens (styles/index.css).
 */
const PalettePreview = ({ palette }: PalettePreviewProps) => (
  <span
    aria-hidden
    data-palette={palette}
    className="flex flex-col gap-1.5 rounded-[10px] border border-grove-line bg-grove-bg p-2"
  >
    <span className="flex flex-col gap-1.5 rounded-md bg-grove-card p-1.5 shadow-grove">
      <span className="flex items-center gap-1.5">
        <span className="size-3.5 shrink-0 rounded-full bg-radial-[at_40%_20%] from-grove-breath to-grove-breath-deep" />
        <span className="h-1 w-3/5 rounded-full bg-grove-ink" />
      </span>
      <span className="h-1.5 rounded-full bg-grove-leaf-soft">
        <span className="block h-full w-3/5 rounded-full bg-grove-leaf" />
      </span>
    </span>
    <span className="h-2.5 w-1/2 rounded-full bg-grove-moss" />
  </span>
)
