"use client";

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  SearchIcon,
  PackageIcon,
  TruckIcon,
  ClockIcon,
  CheckIcon,
  PlusIcon,
} from "@/components/icons";

interface PackageRow {
  id: string;
  trackingNumber: string;
  receiver: string;
  address: string;
  amount: number;
  status: "delivered" | "in_transit" | "pending";
  date: string;
}

const mockPackages: PackageRow[] = [
  {
    id: "1",
    trackingNumber: "PKG-2025-001",
    receiver: "John Smith",
    address: "123 Main St, City",
    amount: 89.99,
    status: "delivered",
    date: "Jan 15, 2025",
  },
  {
    id: "2",
    trackingNumber: "PKG-2025-002",
    receiver: "Sarah Johnson",
    address: "456 Oak Ave, Town",
    amount: 45.5,
    status: "in_transit",
    date: "Jan 16, 2025",
  },
  {
    id: "3",
    trackingNumber: "PKG-2025-003",
    receiver: "Mike Wilson",
    address: "789 Pine St, Village",
    amount: 23.75,
    status: "pending",
    date: "Jan 17, 2025",
  },
];

const statusColors = {
  delivered: "text-green-700 bg-green-50 border-green-200",
  in_transit: "text-yellow-700 bg-yellow-50 border-yellow-200",
  pending: "text-red-700 bg-red-50 border-red-200",
};

const statusIcons = {
  delivered: CheckIcon,
  in_transit: TruckIcon,
  pending: ClockIcon,
};

export default function DailyParcelsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [rows] = useState<PackageRow[]>(mockPackages);

  const stats = {
    total: rows.length,
    delivered: rows.filter((p) => p.status === "delivered").length,
    inTransit: rows.filter((p) => p.status === "in_transit").length,
    pending: rows.filter((p) => p.status === "pending").length,
  };

  const filtered = rows.filter(
    (pkg) =>
      pkg.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.receiver.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Total Parcels
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {stats.total}
              </p>
              <p className="text-xs text-green-600 mt-1">+12% from yesterday</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <PackageIcon size={24} className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Delivered</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {stats.delivered}
              </p>
              <p className="text-xs text-green-600 mt-1">+8% from yesterday</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckIcon size={24} className="text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">In Transit</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {stats.inTransit}
              </p>
              <p className="text-xs text-yellow-600 mt-1">-3% from yesterday</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <TruckIcon size={24} className="text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {stats.pending}
              </p>
              <p className="text-xs text-red-600 mt-1">-2% from yesterday</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
              <ClockIcon size={24} className="text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search parcels..."
              leftIcon={<SearchIcon size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">Filter</Button>
            <Button variant="secondary">Export</Button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Today's Parcels
            </h3>
            <p className="text-sm text-slate-500">Show: 10</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-700 bg-slate-50">
                    Parcel Details
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700 bg-slate-50">
                    Receiver
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700 bg-slate-50">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700 bg-slate-50">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700 bg-slate-50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pkg) => {
                  const StatusIcon = statusIcons[pkg.status];
                  return (
                    <tr
                      key={pkg.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {pkg.trackingNumber.split("-")[0]} Package
                          </p>
                          <p className="text-sm text-slate-500">
                            REF: {pkg.trackingNumber}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {pkg.receiver}
                          </p>
                          <p className="text-sm text-slate-500">
                            {pkg.address}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-slate-900">
                          ${pkg.amount}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                            statusColors[pkg.status]
                          }`}
                        >
                          <StatusIcon size={12} />
                          {pkg.status === "in_transit"
                            ? "In Transit"
                            : pkg.status.charAt(0).toUpperCase() +
                              pkg.status.slice(1)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-600 hover:text-slate-700"
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-slate-500">
              Showing 1 to 10 of {filtered.length} results
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" disabled>
                Previous
              </Button>
              <Button size="sm" className="bg-[#0EA5E9] text-white">
                1
              </Button>
              <Button variant="ghost" size="sm">
                2
              </Button>
              <Button variant="ghost" size="sm">
                3
              </Button>
              <Button variant="secondary" size="sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
