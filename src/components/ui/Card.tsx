import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padded?: boolean;
  twin?: boolean;
  twinContent?: React.ReactNode;
}

export default function Card({
  header,
  footer,
  padded = true,
  className = "",
  children,
  style = {},
  twin = false,
  twinContent,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "rounded-xl border border-slate-200 bg-white shadow-xs",
        className,
      ].join(" ")}
      style={style}
      {...props}
    >
      {header ? (
        <div className="px-6 py-5 border-b border-slate-200/60 flex items-center justify-between">
          {header}
          {twin && twinContent}
        </div>
      ) : null}
      <div className={padded ? "p-6" : undefined}>{children}</div>
      {footer ? (
        <div className="px-6 py-5 border-t border-slate-200/60">{footer}</div>
      ) : null}
    </div>
  );
}
