import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padded?: boolean;
}

export default function Card({
  header,
  footer,
  padded = true,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "rounded-xl border border-slate-200 bg-white shadow-xs",
        className,
      ].join(" ")}
      {...props}
    >
      {header ? (
        <div className="px-6 py-5 border-b border-slate-200/60">{header}</div>
      ) : null}
      <div className={padded ? "p-6" : undefined}>{children}</div>
      {footer ? (
        <div className="px-6 py-5 border-t border-slate-200/60">{footer}</div>
      ) : null}
    </div>
  );
}
