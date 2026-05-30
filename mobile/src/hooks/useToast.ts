import { useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

const INITIAL_STATE = { visible: false, message: '', type: 'info' } as const satisfies ToastState;

export interface UseToastReturn {
  toast: ToastState;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

/**
 * Centralized toast state management.
 * Usage:
 *   const { toast, showToast, hideToast } = useToast();
 *   <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={hideToast} />
 */
export function useToast(): UseToastReturn {
  const [toast, setToast] = useState<ToastState>(INITIAL_STATE);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return { toast, showToast, hideToast };
}
