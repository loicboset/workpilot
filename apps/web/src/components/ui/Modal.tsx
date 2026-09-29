import {
  Dialog as AriaDialog,
  Heading,
  Modal as AriaModal,
  ModalOverlay,
  type DialogProps,
  type ModalOverlayProps,
} from 'react-aria-components'
import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

interface ModalProps extends Omit<ModalOverlayProps, 'children'> {
  children: ReactNode
  /** Near the top, like a command bar, instead of centred. */
  placement?: 'center' | 'top'
  className?: string
}

/** A window over the page that keeps focus inside until it is closed (Esc closes it). */
export function Modal({ children, placement = 'center', className, ...props }: ModalProps) {
  return (
    <ModalOverlay
      isDismissable
      {...props}
      className={twMerge(
        'fixed inset-0 z-50 flex justify-center bg-grove-scrim px-4 backdrop-blur-[2px]',
        placement === 'top' ? 'items-start pt-[12vh]' : 'items-center',
      )}
    >
      <AriaModal
        className={twMerge(
          'w-full max-w-lg rounded-card bg-grove-card p-6 shadow-grove outline-none',
          className,
        )}
      >
        {children}
      </AriaModal>
    </ModalOverlay>
  )
}

/** The content of a Modal or Popover. Needs a `DialogTitle` or an `aria-label`. */
export function Dialog(props: DialogProps) {
  return <AriaDialog {...props} className={twMerge('outline-none', props.className)} />
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return (
    <Heading slot="title" className="mb-4 font-serif text-xl text-grove-ink">
      {children}
    </Heading>
  )
}
