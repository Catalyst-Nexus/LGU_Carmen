import * as Dialog from '@radix-ui/react-dialog'
import { X, Check, XCircle } from 'lucide-react'

interface PendingUser {
  id: string
  name: string
  email: string
  requestedAt: string
}

interface UserActivationDialogProps {
  open: boolean
  onClose: () => void
  user: PendingUser | null
  onActivate: () => void
  onReject: () => void
  isProcessing?: boolean
}

const UserActivationDialog = ({
  open,
  onClose,
  user,
  onActivate,
  onReject,
  isProcessing = false,
}: UserActivationDialogProps) => {
  if (!user) return null

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && !isProcessing && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-xl p-6 w-full max-w-md z-50 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              User Activation
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close"
                disabled={isProcessing}
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4 mb-6">
            <p className="text-sm text-muted">
              Review the following user registration request:
            </p>
            <div className="bg-muted/5 border border-border rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted">Name:</span>
                <span className="text-sm font-medium text-foreground">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Email:</span>
                <span className="text-sm font-medium text-foreground">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted">Requested:</span>
                <span className="text-sm font-medium text-foreground">{user.requestedAt}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onReject}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg flex items-center gap-2 border border-danger text-danger hover:bg-danger/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            <button
              type="button"
              onClick={onActivate}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg flex items-center gap-2 bg-success text-white hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              {isProcessing ? 'Processing...' : 'Activate'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default UserActivationDialog
