import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  leftIcon,
  rightIcon,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className={["relative", className].join(" ")}>
      {leftIcon ? (
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
          {leftIcon}
        </div>
      ) : null}
      <input
        className={[
          "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[15px] text-slate-900 placeholder:text-slate-400 shadow-xs",
          "focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9]",
          leftIcon ? "pl-10" : "",
          rightIcon ? "pr-10" : "",
        ].join(" ")}
        {...props}
      />
      {rightIcon ? (
        <div className="absolute inset-y-0 right-3 flex items-center text-slate-400">
          {rightIcon}
        </div>
      ) : null}
    </div>
  );
}
