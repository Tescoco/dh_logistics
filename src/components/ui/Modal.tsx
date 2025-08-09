"use client";
import React, { PropsWithChildren, useEffect } from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  widthClassName?: string;
};

export default function Modal({
  open,
  title,
  onClose,
  widthClassName,
  children,
}: PropsWithChildren<ModalProps>) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={`w-full ${
            widthClassName ?? "max-w-xl"
          } rounded-xl bg-white shadow-xl border border-slate-200`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="text-[15px] font-semibold text-slate-900">
              {title}
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
            >
              ✕
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
