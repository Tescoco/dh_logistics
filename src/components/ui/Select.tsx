import React from "react";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
};

export default function Select({
  className = "",
  children,
  ...props
}: SelectProps) {
  return (
    <select
      className={[
        "w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 text-[15px] text-slate-900 shadow-xs",
        "focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9]",
        "[background-image:linear-gradient(45deg,transparent_50%,currentColor_50%),linear-gradient(135deg,currentColor_50%,transparent_50%),linear-gradient(to_right,transparent,transparent)]",
        "[background-position:calc(100%-20px)_calc(1em+2px),calc(100%-15px)_calc(1em+2px),calc(100%-2.5em)_0.5em] [background-size:5px_5px,5px_5px,1px_1.5em] [background-repeat:no-repeat]",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </select>
  );
}
