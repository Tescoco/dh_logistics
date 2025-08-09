"use client";

import React from "react";

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export default function Switch({
  checked = false,
  onCheckedChange,
  className = "",
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={[
        "inline-flex h-6 w-10 items-center rounded-full transition-colors",
        checked ? "bg-[#0EA5E9]" : "bg-slate-300",
        className,
      ].join(" ")}
      {...props}
    >
      <span
        className={[
          "h-4 w-4 rounded-full bg-white shadow transform transition-transform mx-1",
          checked ? "translate-x-4" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}
