import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-sm text-navy-600 font-sans leading-relaxed pt-1.5">{message}</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-ghost">
            {cancelLabel}
          </button>
          <button onClick={handleConfirm} className="btn-danger">
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
