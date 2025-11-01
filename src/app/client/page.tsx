"use client";

import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import {
  PackageIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
} from "@/components/icons";
import Link from "next/link";

export default function ClientDashboard() {
  type DeliveryApiItem = {
    _id?: string;
    reference?: string;
    status?:
      | "pending"
      | "assigned"
      | "in_transit"
      | "delivered"
      | "returned"
      | "future_delivery"
      | "rto"
      | "lost_damaged"
      | "cancelled"
      | "returning"
      | "record_created"
      | "attempted_cancel"
      | "no_answer"
      | "number_switched_off"
      | "shipment_on_hold"
      | "out_for_delivery";
    updatedAt?: string | Date;
    createdAt?: string | Date;
    deliveryAddress?: string;
  };
  const [stats, setStats] = useState({
    totalParcels: 0,
    delivered: 0,
    inTransit: 0,
    returned: 0,
    noAnswer: 0,
    outForDelivery: 0,
    productDestroyed: 0,
    lostShipments: 0,
    damagedShipments: 0,
    pending: 0,
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
          totalParcels: d.totalParcels ?? 0,
          delivered: d.delivered ?? 0,
          inTransit: d.inTransit ?? 0,
          returned: d.returned ?? 0,
          noAnswer: d.noAnswer ?? 0,
          outForDelivery: d.outForDelivery ?? 0,
          productDestroyed: d.productDestroyed ?? 0,
          lostShipments: d.lostShipments ?? 0,
          damagedShipments: d.damagedShipments ?? 0,
          pending: d.pending ?? 0,
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
              : status === "out_for_delivery"
              ? `Out for delivery to ${destination} - ${when}`
              : status === "assigned"
              ? `Assigned - ${when}`
              : status === "returned"
              ? `Returned - ${when}`
              : status === "cancelled"
              ? `Cancelled - ${when}`
              : status === "lost_damaged"
              ? `Lost/Damaged - ${when}`
              : status === "rto"
              ? `RTO - ${when}`
              : status === "returning"
              ? `Returning - ${when}`
              : status === "attempted_cancel"
              ? `Attempted Cancel - ${when}`
              : status === "no_answer"
              ? `No Answer - ${when}`
              : status === "number_switched_off"
              ? `Number Switched Off - ${when}`
              : status === "shipment_on_hold"
              ? `Shipment on Hold - ${when}`
              : status === "future_delivery"
              ? `Future Delivery - ${when}`
              : status === "record_created"
              ? `Record Created - ${when}`
              : `Processing - ${when}`;
          const statusLabel =
            status === "delivered"
              ? "Delivered"
              : status === "in_transit"
              ? "In Transit"
              : status === "out_for_delivery"
              ? "Out for Delivery"
              : status === "assigned"
              ? "Assigned"
              : status === "returned"
              ? "Returned"
              : status === "cancelled"
              ? "Cancelled"
              : status === "lost_damaged"
              ? "Lost & Damages"
              : status === "rto"
              ? "RTO"
              : status === "returning"
              ? "Returning"
              : status === "attempted_cancel"
              ? "Attempted Cancel"
              : status === "no_answer"
              ? "No Answer"
              : status === "number_switched_off"
              ? "Number Switched Off"
              : status === "shipment_on_hold"
              ? "Shipment on Hold"
              : status === "future_delivery"
              ? "Future Delivery"
              : status === "record_created"
              ? "Record Created"
              : status === "pending"
              ? "Pending"
              : "Unknown";
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
      case "out_for_delivery":
        return { dot: "bg-blue-500", statusColor: "bg-blue-100 text-blue-700" };
      case "assigned":
        return {
          dot: "bg-purple-500",
          statusColor: "bg-purple-100 text-purple-700",
        };
      case "returned":
      case "rto":
      case "lost_damaged":
      case "cancelled":
        return { dot: "bg-rose-500", statusColor: "bg-rose-100 text-rose-700" };
      case "pending":
      case "record_created":
      case "future_delivery":
        return {
          dot: "bg-amber-500",
          statusColor: "bg-amber-100 text-amber-700",
        };
      case "returning":
      case "attempted_cancel":
      case "no_answer":
      case "number_switched_off":
      case "shipment_on_hold":
        return {
          dot: "bg-orange-500",
          statusColor: "bg-orange-100 text-orange-700",
        };
      default:
        return {
          dot: "bg-gray-500",
          statusColor: "bg-gray-100 text-gray-700",
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

  return (
    <div className="space-y-6">
      {/* Comprehensive Stats Grid - Matching COD Solutions Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* First Row */}
        {[
          {
            label: "Total Parcels",
            value: stats.totalParcels,
            color: "text-[#0052CC]",
          },
          {
            label: "Delivered",
            value: stats.delivered,
            color: "text-[#0052CC]",
          },
          {
            label: "In Transit",
            value: stats.inTransit,
            color: "text-[#0052CC]",
          },
          {
            label: "No Answer",
            value: stats.noAnswer,
            color: "text-[#0052CC]",
          },
          {
            label: "Out For Delivery",
            value: stats.outForDelivery,
            color: "text-[#0052CC]",
          },
          {
            label: "Product Destroyed",
            value: stats.productDestroyed,
            color: "text-[#0052CC]",
          },
        ].map(({ label, value, color }) => (
          <Card
            key={label}
            className="p-4 shadow-sm bg-white rounded-lg border"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {value.toLocaleString()}
              </div>
              <div className={`text-sm font-medium ${color}`}>{label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            label: "Ready For Return",
            value: secondary.readyForReturn,
            color: "text-[#0052CC]",
          },
          {
            label: "Return In Transit",
            value: secondary.returnInTransit,
            color: "text-[#0052CC]",
          },
          {
            label: "Returned To Client",
            value: secondary.returnedInventory,
            color: "text-[#0052CC]",
          },
          {
            label: "Shipment On Hold",
            value: secondary.shipmentOnHold,
            color: "text-[#0052CC]",
          },
          {
            label: "Returned To Inventory",
            value: secondary.returnedInventory,
            color: "text-[#0052CC]",
          },
          {
            label: "Lost Shipments",
            value: stats.lostShipments,
            color: "text-[#0052CC]",
          },
        ].map(({ label, value, color }) => (
          <Card
            key={label}
            className="p-4 shadow-sm bg-white rounded-lg border"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {value.toLocaleString()}
              </div>
              <div className={`text-sm font-medium ${color}`}>{label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            label: "Damaged Shipments",
            value: stats.damagedShipments,
            color: "text-[#0052CC]",
          },
          {
            label: "Pending",
            value: stats.pending,
            color: "text-[#0052CC]",
          },
        ].map(({ label, value, color }) => (
          <Card
            key={label}
            className="p-4 shadow-sm bg-white rounded-lg border"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {value.toLocaleString()}
              </div>
              <div className={`text-sm font-medium ${color}`}>{label}</div>
            </div>
          </Card>
        ))}
        {/* Empty cells to maintain grid layout */}
        <div></div>
        <div></div>
        <div></div>
        <div></div>
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
                  className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${d.statusColor}`}
                >
                  {d.status.replace("_", " ")}
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
