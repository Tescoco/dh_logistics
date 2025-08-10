"use client";

import React, { useEffect, useState } from "react";
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
  type DeliveryApiItem = {
    _id?: string;
    reference?: string;
    status?: "pending" | "assigned" | "in_transit" | "delivered" | "returned";
    updatedAt?: string | Date;
    createdAt?: string | Date;
    deliveryAddress?: string;
  };
  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    inTransit: 0,
    returned: 0,
  });
  const [changes, setChanges] = useState({
    totalPct: 0,
    deliveredPct: 0,
    inTransitPct: 0,
    returnedPct: 0,
  });
  const [adminChanges, setAdminChanges] = useState({
    totalPct: 0,
    deliveredPct: 0,
    inTransitPct: 0,
    returnedPct: 0,
  });
  const [recent, setRecent] = useState<
    {
      id: string;
      description: string;
      status: string;
      dot: string;
      statusColor: string;
    }[]
  >([]);
  const [secondary, setSecondary] = useState({
    readyForReturn: 0,
    returnInTransit: 0,
    shipmentOnHold: 0,
    returnedInventory: 0,
    pending: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/deliveries").then((r) => r.json()),
      fetch("/api/stats/secondary").then((r) => r.json()),
    ])
      .then(([d, list, sec]) => {
        setStats({
          total:
            (d.activeDeliveries ?? 0) + (d.delivered ?? 0) + (d.returned ?? 0),
          delivered: d.delivered ?? 0,
          inTransit: d.inTransit ?? 0,
          returned: d.returned ?? 0,
        });
        setChanges({
          totalPct: d.changes?.totalPct ?? 0,
          deliveredPct: d.changes?.deliveredPct ?? 0,
          inTransitPct: d.changes?.inTransitPct ?? 0,
          returnedPct: d.changes?.returnedPct ?? 0,
        });
        setAdminChanges({
          totalPct: d.adminChanges?.totalPct ?? 0,
          deliveredPct: d.adminChanges?.deliveredPct ?? 0,
          inTransitPct: d.adminChanges?.inTransitPct ?? 0,
          returnedPct: d.adminChanges?.returnedPct ?? 0,
        });
        setSecondary({
          readyForReturn: sec.readyForReturn ?? 0,
          returnInTransit: sec.returnInTransit ?? 0,
          shipmentOnHold: sec.shipmentOnHold ?? 0,
          returnedInventory: sec.returnedInventory ?? 0,
          pending: sec.pending ?? 0,
        });

        const rows = ((list.deliveries || []) as DeliveryApiItem[]).slice(0, 3);
        const mapped = rows.map((it) => {
          const status = String(it.status || "pending");
          const { dot, statusColor } = statusToColors(status);
          const when = timeAgo(
            new Date(it.updatedAt ?? it.createdAt ?? Date.now())
          );
          const id = (it.reference || it._id || "")
            .toString()
            .slice(-9)
            .toUpperCase();
          const destination = it.deliveryAddress || "destination";
          const desc =
            status === "delivered"
              ? `Delivered to ${destination} - ${when}`
              : status === "in_transit"
              ? `En route to ${destination} - ${when}`
              : status === "assigned"
              ? `Assigned - ${when}`
              : status === "returned"
              ? `Returned - ${when}`
              : `Processing - ${when}`;
          const statusLabel =
            status === "delivered"
              ? "Delivered"
              : status === "in_transit"
              ? "In Transit"
              : status === "assigned"
              ? "Assigned"
              : status === "returned"
              ? "Returned"
              : "Pending";
          return {
            id,
            description: desc,
            status: statusLabel,
            dot,
            statusColor,
          };
        });
        setRecent(mapped);
      })
      .catch(() => {});
  }, []);

  function statusToColors(status: string): {
    dot: string;
    statusColor: string;
  } {
    switch (status) {
      case "delivered":
        return {
          dot: "bg-emerald-500",
          statusColor: "bg-emerald-100 text-emerald-700",
        };
      case "in_transit":
        return { dot: "bg-blue-500", statusColor: "bg-blue-100 text-blue-700" };
      case "assigned":
        return {
          dot: "bg-purple-500",
          statusColor: "bg-purple-100 text-purple-700",
        };
      case "returned":
        return { dot: "bg-rose-500", statusColor: "bg-rose-100 text-rose-700" };
      default:
        return {
          dot: "bg-amber-500",
          statusColor: "bg-amber-100 text-amber-700",
        };
    }
  }

  function timeAgo(date: Date): string {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  function formatChange(pct: number): string {
    const sign = pct > 0 ? "+" : "";
    return `${sign}${pct}% from last month`;
  }

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Parcels",
            value: stats.total,
            change: formatChange(adminChanges.totalPct),
            Icon: PackageIcon,
            color: "bg-blue-100 text-blue-600",
          },
          {
            label: "Delivered",
            value: stats.delivered,
            change: formatChange(adminChanges.deliveredPct),
            Icon: CheckIcon,
            color: "bg-emerald-100 text-emerald-600",
          },
          {
            label: "In Transit",
            value: stats.inTransit,
            change: formatChange(adminChanges.inTransitPct),
            Icon: TruckIcon,
            color: "bg-amber-100 text-amber-600",
          },
          {
            label: "Returned",
            value: stats.returned,
            change: formatChange(adminChanges.returnedPct),
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
            value: secondary.readyForReturn,
            Icon: RefreshIcon,
            iconColor: "text-purple-600",
          },
          {
            label: "Return in Transit",
            value: secondary.returnInTransit,
            Icon: TruckIcon,
            iconColor: "text-yellow-600",
          },
          {
            label: "Shipment on Hold",
            value: secondary.shipmentOnHold,
            Icon: ClockIcon,
            iconColor: "text-red-600",
          },
          {
            label: "Returned Inventory",
            value: secondary.returnedInventory,
            Icon: PackageIcon,
            iconColor: "text-indigo-600",
          },
          {
            label: "Pending",
            value: secondary.pending,
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
            {recent.map((d) => (
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
