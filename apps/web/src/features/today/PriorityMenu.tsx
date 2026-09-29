import { SubmenuTrigger } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { PriorityBars, PriorityIcon } from '@/components/PriorityBadge'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { isPriority, PRIORITIES, type Priority } from '@/lib/priority'

type PrioritySubmenuProps = {
  priority: Priority | null
  onSelect: (priority: Priority | null) => void
}

/** "Priority ›" in a todo's menu: high, medium, low, or none (ADR 0030). */
export const PrioritySubmenu = ({ priority, onSelect }: PrioritySubmenuProps) => {
  // HOOKS
  const { t } = useTranslation()

  return (
    <SubmenuTrigger>
      <MenuItem>
        <PriorityBars priority={1} />
        {t('priority.menu')}
      </MenuItem>
      <Menu
        selectionMode="single"
        selectedKeys={[priority ?? 'none']}
        onAction={(key) => onSelect(isPriority(key) ? key : null)}
      >
        {PRIORITIES.map((level) => (
          <MenuItem key={level} id={level} textValue={t(`priority.levels.${level}`)}>
            <PriorityIcon priority={level} />
            {t(`priority.levels.${level}`)}
          </MenuItem>
        ))}
        <MenuItem id="none">{t('priority.none')}</MenuItem>
      </Menu>
    </SubmenuTrigger>
  )
}
