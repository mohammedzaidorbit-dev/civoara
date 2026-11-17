'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (message: Omit<ToastMessage, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, title, description, duration = 4000 }: Omit<ToastMessage, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, title, description, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => toast({ type: 'success', title, description }),
    [toast]
  );
  const error = useCallback(
    (title: string, description?: string) => toast({ type: 'error', title, description }),
    [toast]
  );
  const warning = useCallback(
    (title: string, description?: string) => toast({ type: 'warning', title, description }),
    [toast]
  );
  const info = useCallback(
    (title: string, description?: string) => toast({ type: 'info', title, description }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
            error: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
            info: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
          };

          const borders = {
            success: 'border-emerald-200 bg-white',
            error: 'border-rose-200 bg-white',
            warning: 'border-amber-200 bg-white',
            info: 'border-sky-200 bg-white',
          };

          return (
            <div
              key={t.id}
              className={`
                pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all
                animate-in slide-in-from-bottom-3 duration-200 ${borders[t.type]}
              `}
            >
              {icons[t.type]}
              <div className="flex-1 space-y-0.5">
                <p className="text-xs font-semibold text-slate-900">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-slate-500 leading-relaxed">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
