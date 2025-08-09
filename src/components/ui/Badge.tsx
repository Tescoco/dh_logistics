import React from "react";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export default function Badge({
  children,
  variant = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  const styles: Record<BadgeVariant, string> = {
    default: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
    neutral: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
    success:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    danger: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
    info: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  };
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium",
        styles[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
