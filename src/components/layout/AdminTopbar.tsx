"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BellIcon, UserIcon } from "@/components/icons";

export default function AdminTopbar({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const title = getTitleFromPath(pathname || "/admin");
  const [me, setMe] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null>(null);
  useEffect(() => {
    let mounted = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (mounted) setMe(d.user ?? null);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  return (
    <header className="sticky top-0 z-20 h-18 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            aria-label="Open sidebar"
            onClick={onMenuClick}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
            </svg>
          </button>
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">
              Welcome back, manage your operations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="relative grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            aria-label="Notifications"
          >
            <BellIcon size={20} />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white"></span>
          </button>
          <div className="hidden lg:flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 hover:bg-slate-100 transition-colors cursor-pointer">
            <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-[#0EA5E9] to-[#0284c7] text-white">
              <UserIcon size={16} />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-900">
                {me
                  ? [me.firstName, me.lastName].filter(Boolean).join(" ") ||
                    me.email
                  : "—"}
              </div>
              <div className="text-xs text-slate-500">{me?.email ?? ""}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function getTitleFromPath(path: string): string {
  if (path.startsWith("/admin/deliveries")) return "Deliveries";
  if (path.startsWith("/admin/delivery-status")) return "Delivery Status";
  if (path.startsWith("/admin/users")) return "Users";
  if (path.startsWith("/admin/settings")) return "Settings";
  if (path.startsWith("/admin/profile")) return "Profile";
  return "Dashboard";
}
