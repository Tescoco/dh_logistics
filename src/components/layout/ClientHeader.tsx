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

export default function ClientHeader() {
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
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl h-20 flex items-center">
      <div className="w-72 border-r border-slate-200/60 h-full flex items-center px-6">
        <Link href="/client" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#0284c7] shadow-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <div className="font-semibold text-lg text-slate-900">Shipz</div>
          </div>
        </Link>
      </div>
      <div className="flex-1 px-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
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
        <div className="flex items-center gap-3">
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
