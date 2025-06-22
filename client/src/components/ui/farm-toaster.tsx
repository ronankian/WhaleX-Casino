import React from "react";
import { useToast } from "../../hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";

export function FarmToaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const isError = props.variant === 'destructive';
        return (
          <Toast
            key={id}
            {...props}
            className={`fixed bottom-5 right-5 w-auto max-w-sm p-4 rounded-lg shadow-2xl text-white
              ${isError ? 'bg-red-700/90 border-red-500' : 'bg-green-600/90 border-green-400'}
              border-2 backdrop-blur-sm transition-all animate-in slide-in-from-bottom-5`}
          >
            <div className="grid gap-1">
              {title && <ToastTitle className="text-xl font-bold">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-base text-white/90">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="absolute top-2 right-2 text-white/80 hover:text-white" />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
} 