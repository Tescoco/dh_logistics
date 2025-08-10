"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  DashboardIcon,
  PackageIcon,
  TruckIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/icons";
import Image from "next/image";
type NavItem = {
  href: string;
  label: string;
  icon?: "dashboard" | "package" | "truck" | "settings" | "user";
};

const items: NavItem[] = [
  { href: "/client", label: "Dashboard", icon: "dashboard" },
  { href: "/client/delivery/add", label: "Add Delivery", icon: "truck" },
  { href: "/client/track", label: "Track Deliveries", icon: "truck" },
  { href: "/client/daily-parcels", label: "Daily Parcels", icon: "package" },
  { href: "/client/cod-report", label: "COD Report", icon: "dashboard" },
  { href: "/client/settings", label: "Settings", icon: "settings" },
];

export default function ClientSidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const [me, setMe] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!mounted) return;
        setMe(d.user ?? null);
      })
      .catch(() => setMe(null));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={[
          "fixed inset-0 z-30 bg-slate-900/40 transition-opacity md:hidden",
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      />
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200/60 px-6 py-6 flex flex-col transition-transform",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      >
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="h-10 w-10 flex items-center justify-center">
            {/* <span className="text-white font-bold text-lg">S</span> */}
            <Image
              src="/favicon.ico"
              alt="Shipz Logo"
              width={32}
              height={32}
              className="text-white font-bold text-lg"
            />
          </div>
          <div>
            <div className="font-semibold text-lg text-slate-900">Shipz</div>
            <div className="text-xs text-slate-500 font-medium">
              Client Portal
            </div>
          </div>
        </div>
        <nav className="space-y-1 flex-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose?.()}
                className={[
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium transition-all duration-200 group",
                  active
                    ? "bg-gradient-to-r from-[#0EA5E9] to-[#0284c7] text-white shadow-lg shadow-blue-500/25"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                {renderIcon(item.icon, active)}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            {me?.avatarUrl ? (
              <img
                src={me.avatarUrl}
                alt="Avatar"
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-slate-200 grid place-items-center">
                <UserIcon size={20} className="text-slate-600" />
              </div>
            )}
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {me?.firstName || me?.lastName
                  ? `${me?.firstName ?? ""} ${me?.lastName ?? ""}`.trim()
                  : "—"}
              </div>
              <div className="text-xs text-slate-500">{me?.email ?? "—"}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function renderIcon(icon: NavItem["icon"], isActive: boolean) {
  const common = isActive
    ? "text-white"
    : "text-slate-600 group-hover:text-slate-900";
  switch (icon) {
    case "dashboard":
      return (
        <span aria-hidden className={common}>
          <DashboardIcon size={20} />
        </span>
      );
    case "package":
      return (
        <span aria-hidden className={common}>
          <PackageIcon size={20} />
        </span>
      );
    case "truck":
      return (
        <span aria-hidden className={common}>
          <TruckIcon size={20} />
        </span>
      );
    case "settings":
      return (
        <span aria-hidden className={common}>
          <SettingsIcon size={20} />
        </span>
      );
    case "user":
      return (
        <span aria-hidden className={common}>
          <UserIcon size={20} />
        </span>
      );
    default:
      return null;
  }
}
