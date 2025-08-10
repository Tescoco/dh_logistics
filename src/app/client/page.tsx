"use client";

import React from "react";
import Card from "@/components/ui/Card";
import {
  PackageIcon,
  TruckIcon,
  CheckIcon,
  RefreshIcon,
  ClockIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
} from "@/components/icons";
import Link from "next/link";

export default function ClientDashboard() {
  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Parcels",
            value: 2547,
            change: "+12% from last month",
            Icon: PackageIcon,
            color: "bg-blue-100 text-blue-600",
          },
          {
            label: "Delivered",
            value: 1892,
            change: "+8% from last month",
            Icon: CheckIcon,
            color: "bg-emerald-100 text-emerald-600",
          },
          {
            label: "In Transit",
            value: 423,
            change: "-3% from last month",
            Icon: TruckIcon,
            color: "bg-amber-100 text-amber-600",
          },
          {
            label: "Returned",
            value: 89,
            change: "+2% from last month",
            Icon: RefreshIcon,
            color: "bg-rose-100 text-rose-600",
          },
        ].map(({ label, value, change, Icon, color }) => (
          <Card key={label} className="p shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {value.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-2">{change}</p>
              </div>
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}
              >
                <Icon size={28} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Secondary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Ready for Return",
            value: 34,
            Icon: RefreshIcon,
            iconColor: "text-purple-600",
          },
          {
            label: "Return in Transit",
            value: 12,
            Icon: TruckIcon,
            iconColor: "text-yellow-600",
          },
          {
            label: "Shipment on Hold",
            value: 67,
            Icon: ClockIcon,
            iconColor: "text-red-600",
          },
          {
            label: "Returned Inventory",
            value: 156,
            Icon: PackageIcon,
            iconColor: "text-indigo-600",
          },
          {
            label: "Pending",
            value: 78,
            Icon: ClockIcon,
            iconColor: "text-orange-600",
          },
        ].map(({ label, value, Icon, iconColor }) => (
          <Card key={label} className=" shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <Icon size={24} className={iconColor} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-semibold text-slate-800">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Deliveries and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <h3 className="font-semibold text-lg text-slate-900 mb-4">
            Recent Deliveries
          </h3>
          <div className="space-y-2">
            {[
              {
                id: "DL2025001",
                description: "Delivered to Mumbai - 2 hours ago",
                status: "Delivered",
                dot: "bg-emerald-500",
                statusColor: "bg-emerald-100 text-emerald-700",
              },
              {
                id: "DL2025002",
                description: "En route to Delhi - 4 hours ago",
                status: "In Transit",
                dot: "bg-blue-500",
                statusColor: "bg-blue-100 text-blue-700",
              },
              {
                id: "DL2025003",
                description: "Processing at hub - 6 hours ago",
                status: "Processing",
                dot: "bg-amber-500",
                statusColor: "bg-amber-100 text-amber-700",
              },
            ].map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${d.dot}`} />
                  <div>
                    <span className="font-medium text-slate-800">#{d.id}</span>
                    <p className="text-xs text-slate-500">{d.description}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${d.statusColor}`}
                >
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="shadow-sm">
          <h3 className="font-semibold text-lg text-slate-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "Add Delivery",
                href: "/client/delivery/add",
                Icon: PlusIcon,
              },
              {
                label: "Track Package",
                href: "/client/track",
                Icon: SearchIcon,
              },
              {
                label: "Generate Report",
                href: "/client/cod-report",
                Icon: PackageIcon,
              },
              {
                label: "Settings",
                href: "/client/settings",
                Icon: SettingsIcon,
              },
            ].map(({ label, href, Icon }) => (
              <Link href={href} key={href}>
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors h-full">
                  <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center shadow-sm mb-2">
                    <Icon size={20} className="text-slate-600" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 text-center">
                    {label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
