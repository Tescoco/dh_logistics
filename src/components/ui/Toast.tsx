"use client";

import React, { useEffect, useState } from "react";
import {
  CheckIcon,
  XIcon,
  AlertTriangleIcon,
  InfoIcon,
} from "@/components/icons";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      handleRemove();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.duration]);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckIcon size={20} className="text-green-600" />;
      case "error":
        return <XIcon size={20} className="text-red-600" />;
      case "warning":
        return <AlertTriangleIcon size={20} className="text-amber-600" />;
      case "info":
        return <InfoIcon size={20} className="text-blue-600" />;
      default:
        return <InfoIcon size={20} className="text-blue-600" />;
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-900";
      case "error":
        return "bg-red-50 border-red-200 text-red-900";
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-900";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-900";
      default:
        return "bg-blue-50 border-blue-200 text-blue-900";
    }
  };

  const getProgressBarColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-amber-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-300 ease-out
        ${getColorClasses()}
        ${
          isVisible && !isRemoving
            ? "transform translate-x-0 opacity-100 scale-100"
            : "transform translate-x-full opacity-0 scale-95"
        }
      `}
    >
      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-1 ${getProgressBarColor()} transition-all ease-linear`}
        style={{
          width: "100%",
          animation: `shrink ${toast.duration || 3000}ms linear forwards`,
        }}
      />

      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{toast.title}</div>
          {toast.message && (
            <div className="mt-1 text-sm opacity-90">{toast.message}</div>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-black/10 transition-colors"
        >
          <XIcon size={16} className="opacity-60" />
        </button>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};
