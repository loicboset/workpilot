import { MoreHorizontal, Pause, Pencil, Play, Rss, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { MenuTrigger } from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { twMerge } from 'tailwind-merge'
import { IconButton } from '@/components/ui/IconButton'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { formatAgo } from '@/lib/format'
import { ConnectorForm } from './ConnectorForm'
import { siteOf, useDeleteConnector, useUpdateConnector, type Connector } from './connectors'

/** The codes of a failed check with their own words (ADR 0032); others get a general one. */
const CHECK_ERRORS = ['feed_unreachable', 'feed_not_found']

type ConnectorRowProps = {
  connector: Connector
  /** The time now, in milliseconds (`useMinuteClock`). */
  now: number
}

/** A connection: its name, its site, a quiet status, and a menu to change, pause or remove it. */
export const ConnectorRow = ({ connector, now }: ConnectorRowProps) => {
  // STATES
  const [isEditing, setEditing] = useState(false)

  // RQ
  const update = useUpdateConnector()
  const remove = useDeleteConnector()

  // HOOKS
  const { t, i18n } = useTranslation()

  // METHODS
  const onAction = (action: string) => {
    if (action === 'edit') setEditing(true)
    if (action === 'pause') setPaused(true)
    if (action === 'resume') setPaused(false)
    if (action === 'remove') remove.mutate(connector.id)
  }

  const setPaused = (isPaused: boolean) =>
    update.mutate({
      id: connector.id,
      changes: { paused_at: isPaused ? new Date().toISOString() : null },
    })

  const status = (): string => {
    if (connector.paused_at) return t('connectors.status.paused')
    if (connector.last_error) {
      const code = CHECK_ERRORS.includes(connector.last_error) ? connector.last_error : 'failed'
      return t(`connectors.status.${code}`)
    }
    if (!connector.last_checked_at) return t('connectors.status.notChecked')
    if (now - Date.parse(connector.last_checked_at) < 60_000)
      return t('connectors.status.justChecked')
    return t('connectors.status.checked', {
      ago: formatAgo(connector.last_checked_at, i18n.language, now),
    })
  }

  // VARS
  const isPaused = connector.paused_at !== null

  return (
    <li className="flex items-center gap-3 py-2.5">
      <span
        aria-hidden
        className={twMerge(
          'flex size-8 shrink-0 items-center justify-center rounded-full bg-grove-sand text-grove-sand-ink [&>svg]:size-4',
          isPaused && 'opacity-50',
        )}
      >
        <Rss />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] leading-5 font-semibold text-grove-ink">
          {connector.name}
        </p>
        <p className="truncate text-[13px] leading-4.5 text-grove-muted">
          {siteOf(connector.url)} · {status()}
        </p>
      </div>
      <MenuTrigger>
        <IconButton size="sm" aria-label={t('connectors.moreFor', { name: connector.name })}>
          <MoreHorizontal />
        </IconButton>
        <Menu onAction={(key) => onAction(String(key))}>
          <MenuItem id="edit">
            <Pencil aria-hidden />
            {t('common.edit')}
          </MenuItem>
          {isPaused ? (
            <MenuItem id="resume">
              <Play aria-hidden />
              {t('connectors.resume')}
            </MenuItem>
          ) : (
            <MenuItem id="pause">
              <Pause aria-hidden />
              {t('connectors.pause')}
            </MenuItem>
          )}
          <MenuItem id="remove" isDanger>
            <Trash2 aria-hidden />
            {t('connectors.remove')}
          </MenuItem>
        </Menu>
      </MenuTrigger>
      <ConnectorForm connector={connector} isOpen={isEditing} onOpenChange={setEditing} />
    </li>
  )
}
