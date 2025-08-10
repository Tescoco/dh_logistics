"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import React from "react";
import {
  DashboardIcon,
  PackageIcon,
  TruckIcon,
  UsersIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  icon?: string;
  type?: "group";
  children?: NavItem[];
};

const topLevel: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  {
    label: "Deliveries",
    icon: "truck",
    type: "group",
    href: "/admin/deliveries",
    children: [
      { href: "/admin/deliveries?tab=cod    ", label: "COD Drivers" },
      { href: "/admin/deliveries?tab=internal", label: "Internal Drivers" },
    ],
  },
  { href: "/admin/delivery-status", label: "Delivery Status", icon: "package" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
  { href: "/admin/profile", label: "Profile", icon: "user" },
];

export default function AdminSidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  return (
    <Suspense fallback={null}>
      <AdminSidebarInner mobileOpen={mobileOpen} onClose={onClose} />
    </Suspense>
  );
}

function AdminSidebarInner({
  mobileOpen,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab");

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={[
          "fixed inset-0 z-30 bg-slate-900/40 transition-opacity lg:hidden",
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      />
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 w-[280px] border-r border-slate-200/60 bg-white/80 backdrop-blur-xl px-6 py-6 transition-transform",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      >
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#0284c7] shadow-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <div className="font-semibold text-lg text-slate-900">Shipz</div>
            <div className="text-xs text-slate-500 font-medium">
              Admin Portal
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-2">
          {/* Deliveries group */}

          {/* Other items */}
          <div className="space-y-1">
            {topLevel.map((item) => {
              const active = pathname === item.href;
              if (item.type === "group") {
                return (
                  <div key={item.href} className="mb-4">
                    <div
                      className={[
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition-all duration-200",
                        pathname === item.href
                          ? "bg-slate-100 text-slate-900 shadow-sm"
                          : "text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <span aria-hidden className="text-slate-600">
                        <TruckIcon size={20} />
                      </span>
                      <span className="font-semibold">{item.label}</span>
                    </div>
                    <div className="mt-2 space-y-1 pl-4">
                      {item.children?.map((child) => {
                        const active =
                          pathname === child.href ||
                          (tab && child.href.includes(tab));
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => onClose?.()}
                            className={[
                              "block rounded-lg px-4 py-2.5 text-[14px] font-medium transition-all duration-200 group",
                              active
                                ? "bg-gradient-to-r from-[#0EA5E9] to-[#0284c7] text-white shadow-lg shadow-blue-500/25"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                            ].join(" ")}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={[
                                  "w-1.5 h-1.5 rounded-full transition-all duration-200",
                                  active
                                    ? "bg-white"
                                    : "bg-slate-400 group-hover:bg-slate-600",
                                ].join(" ")}
                              />
                              {child.label}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }
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
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}

function renderIcon(name?: string, isActive = false) {
  const common = isActive
    ? "text-white"
    : "text-slate-600 group-hover:text-slate-900";
  switch (name) {
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
    case "users":
      return (
        <span aria-hidden className={common}>
          <UsersIcon size={20} />
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
