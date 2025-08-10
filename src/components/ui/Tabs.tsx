"use client";

import React from "react";

export interface TabItem {
  key: string;
  label: React.ReactNode;
}

export default function Tabs({
  items,
  value,
  onChange,
  className = "",
}: {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex gap-6 border-b border-slate-200">
        {items.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={[
              "-mb-px border-b-2 px-1.5 py-3 text-sm font-medium",
              value === t.key
                ? "border-[#0EA5E9] text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
