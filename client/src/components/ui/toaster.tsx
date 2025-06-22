import React from "react";
import { useToast } from "../../hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, className, ...props }) {
        const isError = props.variant === 'destructive'
        
        // Use custom className if provided, otherwise use default styling
        const toastClassName = className || `fixed bottom-5 right-5 w-96 p-4 rounded-lg shadow-2xl text-white
          bg-slate-900/90 backdrop-blur-sm border-2
          ${isError ? 'border-red-600' : 'border-green-500'}
          transition-all animate-in slide-in-from-bottom-5`
        
        return (
          <Toast
            key={id}
            {...props}
            className={toastClassName}
          >
            <div className="grid gap-1">
              {title && <ToastTitle className="text-lg font-bold">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-sm text-white/80">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="absolute top-2 right-2 text-white/80 hover:text-white" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
