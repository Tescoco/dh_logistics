"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SearchIcon, UserIcon, BellIcon, PlusIcon } from "@/components/icons";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const navigation = [
  {
    name: "Dashboard",
    href: "/client",
    helperText: "Welcome back! Here's your delivery overview",
  },
  {
    name: "Add Delivery",
    href: "/client/delivery/add",
    helperText: "Create a new delivery order with comprehensive details",
  },
  {
    name: "Track Deliveries",
    href: "/client/track",
    helperText: "Monitor and track all delivery statuses in real-time",
  },
  {
    name: "Edit Delivery",
    href: `/client/delivery/:id`,
    helperText: "Edit a delivery order with comprehensive details",
  },
  {
    name: "Daily Parcels",
    href: "/client/daily-parcels",
    helperText: "Manage and track all your daily parcels efficiently",
    search: true,
    add: true,
  },
  {
    name: "COD Report",
    href: "/client/cod-report",
    helperText: "Download and manage your Cash on Delivery reports",
  },
  {
    name: "Settings",
    href: "/client/settings",
    helperText: "Manage your account settings and preferences",
  },
];

export default function ClientHeader({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  React.useEffect(() => {
    if (pathname !== "/client/daily-parcels") return;
    const url = new URL(window.location.href);
    setSearch(url.searchParams.get("q") ?? "");
    const onPopState = () => {
      const next = new URL(window.location.href);
      setSearch(next.searchParams.get("q") ?? "");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [pathname]);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl h-16 sm:h-20 flex items-center">
      <div className="flex items-center gap-3 pl-4 sm:pl-6 pr-4 md:ml-60">
        <button
          className="md:hidden grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
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
      </div>
      <div className="flex-1 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="hidden md:block">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {navigation.find((item) => item.href === pathname)?.name ||
              "Edit Delivery"}
          </h1>
          <p className="text-slate-600 mt-1">
            {navigation.find((item) => item.href === pathname)?.helperText ||
              "Edit a delivery order with comprehensive details"}
          </p>
        </div>
      </div>
      {navigation.find(
        (item) => item.search && pathname === "/client/daily-parcels"
      ) && (
        <div className="hidden sm:flex items-center gap-3 pr-4">
          <Input
            className="w-72"
            leftIcon={<SearchIcon size={16} />}
            placeholder="Search parcels..."
            value={search}
            onChange={(e) => {
              const q = e.target.value;
              setSearch(q);
              const next = new URL(window.location.href);
              if (q) next.searchParams.set("q", q);
              else next.searchParams.delete("q");
              router.replace(next.pathname + next.search);
            }}
          />
          {navigation.find((item) => item.add) && (
            <Link href="/client/delivery/add">
              <Button leftIcon={<PlusIcon size={18} />}>Add Parcel</Button>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
