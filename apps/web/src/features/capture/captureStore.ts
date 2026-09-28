import { create } from 'zustand'

/** Whether the capture bar is open. It opens from anywhere: ⌘K / Ctrl+K, or a button. */
export const useCaptureBar = create<{
  isOpen: boolean
  setOpen: (isOpen: boolean) => void
}>((set) => ({
  isOpen: false,
  setOpen: (isOpen) => set({ isOpen }),
}))

export const openCaptureBar = () => useCaptureBar.getState().setOpen(true)
