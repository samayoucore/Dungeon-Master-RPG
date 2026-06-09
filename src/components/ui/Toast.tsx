import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error';
}

/** Small toast queue with auto-dismiss. */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, type: ToastItem['type'] = 'success', duration = 2000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  return { toasts, push };
}

/** Stacked toast notifications, bottom-right. */
export default function Toast({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex flex-col gap-2">
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`rounded-md px-3 py-2 text-sm shadow-lg ${
            toast.type === 'success' ? 'bg-surface-elevated text-parchment' : 'bg-danger text-parchment'
          }`}
        >
          {toast.message}
        </motion.div>
      ))}
    </div>
  );
}
