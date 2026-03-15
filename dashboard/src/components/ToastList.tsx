import type { ToastMessage } from "../utils/types"
import { Toast } from "./ui/Toast"

interface ToastListProps {
  toasts: ToastMessage[]
}

export function ToastList({ toasts }: ToastListProps) {
  return (
    <div className="fixed bottom-3 right-3 z-[200] flex flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((toast) => (
        <Toast key={toast.id} tone={toast.type}>
          {toast.message}
        </Toast>
      ))}
    </div>
  )
}
