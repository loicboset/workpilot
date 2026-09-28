import { Flag } from 'lucide-react'
import { SubmenuTrigger } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { Menu, MenuItem } from '@/components/ui/Menu'
import type { Milestone } from '@/db/types'

/** "Link to a milestone ›" in a row's menu (ADR 0013: links are optional). */
export function MilestoneSubmenu({
  milestones,
  selectedId,
  onSelect,
}: {
  milestones: Milestone[]
  selectedId: string | null
  onSelect: (milestoneId: string | null) => void
}) {
  const { t } = useTranslation()
  return (
    <SubmenuTrigger>
      <MenuItem>
        <Flag aria-hidden />
        {t('today.linkMilestone')}
      </MenuItem>
      <Menu
        selectionMode="single"
        selectedKeys={[selectedId ?? 'none']}
        onAction={(key) => onSelect(key === 'none' ? null : String(key))}
      >
        <MenuItem id="none">{t('today.noMilestone')}</MenuItem>
        {milestones.map((milestone) => (
          <MenuItem key={milestone.id} id={milestone.id}>
            {milestone.title}
          </MenuItem>
        ))}
      </Menu>
    </SubmenuTrigger>
  )
}
