import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, Modal } from '@/components/ui/Modal'
import { CaptureComposer } from './CaptureComposer'
import { useCaptureBar } from './captureStore'

/** The capture bar (⌘K / Ctrl+K from anywhere): empty your mind, one line at a time. */
export const CaptureBar = () => {
  // HOOKS
  const { t } = useTranslation()
  const { isOpen, setOpen } = useCaptureBar()
  useCaptureShortcut()

  return (
    <Modal isOpen={isOpen} onOpenChange={setOpen} placement="top" className="max-w-xl p-5">
      <Dialog aria-label={t('capture.title')}>
        <CaptureComposer
          variant="bar"
          label={t('capture.title')}
          savedMessage={(kind) => t('capture.saved', { kind })}
          autoFocus
        />
      </Dialog>
    </Modal>
  )
}

/** ⌘K on a Mac, Ctrl+K elsewhere, from any page. */
const useCaptureShortcut = () => {
  // HOOKS
  const setOpen = useCaptureBar((state) => state.setOpen)

  // EFFECTS
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setOpen])
}
