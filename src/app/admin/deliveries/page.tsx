"use client";

import Card from "@/components/ui/Card";
import Tabs from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { PlusIcon, UploadIcon, SearchIcon } from "@/components/icons";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const tabs = [
  { key: "cod", label: "COD Drivers" },
  { key: "internal", label: "Internal Drivers" },
];

export default function DeliveriesPage() {
  return (
    <Suspense fallback={null}>
      <DeliveriesInner />
    </Suspense>
  );
}

function DeliveriesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") || "cod";
  return (
    <div className="space-y-6">
      <Tabs
        className="-mt-2"
        items={tabs}
        value={tab}
        onChange={(t) => {
          router.push(`/admin/deliveries?tab=${t}`);
        }}
      />

      {tab === "cod" ? <CODTab /> : <InternalTab />}
    </div>
  );
}

type DeliveryRow = {
  _id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  codAmount?: number;
  status: string;
  createdAt: string;
};

function CODTab() {
  const router = useRouter();
  const [rows, setRows] = useState<DeliveryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [counts, setCounts] = useState({
    total: 0,
    pendingAssignment: 0,
    inTransit: 0,
    deliveredToday: 0,
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch("/api/deliveries?payment=cod")
      .then((r) => r.json())
      .then((d) => mounted && setRows(d.deliveries ?? []))
      .finally(() => mounted && setLoading(false));
    fetch("/api/deliveries/stats?payment=cod")
      .then((r) => r.json())
      .then(
        (d) =>
          mounted &&
          setCounts({
            total: d.total ?? 0,
            pendingAssignment: d.pendingAssignment ?? 0,
            inTransit: d.inTransit ?? 0,
            deliveredToday: d.deliveredToday ?? 0,
          })
      );
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.customerName, r.customerPhone, r.deliveryAddress].some((v) =>
        (v || "").toLowerCase().includes(q)
      )
    );
  }, [rows, query]);

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <Button
          onClick={() => {
            router.push("/admin/deliveries/new");
          }}
          leftIcon={<PlusIcon size={18} />}
        >
          Add New Delivery
        </Button>
        <Button variant="secondary" leftIcon={<UploadIcon size={18} />}>
          Bulk Upload CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <div className="text-[13px] text-slate-500">Total COD Orders</div>
          <div className="mt-2 text-2xl font-semibold">{counts.total}</div>
        </Card>
        <Card>
          <div className="text-[13px] text-slate-500">Pending Assignment</div>
          <div className="mt-2 text-2xl font-semibold">
            {counts.pendingAssignment}
          </div>
        </Card>
        <Card>
          <div className="text-[13px] text-slate-500">Out for Delivery</div>
          <div className="mt-2 text-2xl font-semibold">{counts.inTransit}</div>
        </Card>
        <Card>
          <div className="text-[13px] text-slate-500">Delivered Today</div>
          <div className="mt-2 text-2xl font-semibold">
            {counts.deliveredToday}
          </div>
        </Card>
      </div>

      <Card header={<div className="font-semibold">Bulk Delivery Upload</div>}>
        <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50 p-10 text-center">
          Drop your delivery CSV file here or click to browse
          <div className="mt-4">
            <Button leftIcon={<UploadIcon size={18} />}>Choose File</Button>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button>Upload & Process Deliveries</Button>
        </div>
      </Card>

      <Card header={<div className="font-semibold">Quick Add Delivery</div>}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <Input placeholder="Customer Name" />
          <Input placeholder="Customer Phone" />
          <Input placeholder="COD Amount" />
          <Input className="md:col-span-2" placeholder="Delivery Address" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
          <Select className="md:col-span-2">
            <option>Select COD Driver</option>
          </Select>
          <div className="md:col-span-3 flex justify-end">
            <Button>Add Delivery</Button>
          </div>
        </div>
      </Card>

      <Card
        header={<div className="font-semibold">COD Deliveries</div>}
        padded={false}
      >
        <div className="p-5 flex items-center gap-4">
          <Select className="w-40">
            <option>All Statuses</option>
          </Select>
          <Input
            className="ml-auto w-80"
            leftIcon={<SearchIcon size={16} />}
            placeholder="Search deliveries..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-[13px] text-slate-500">
                {[
                  "Order ID",
                  "Customer",
                  "Phone",
                  "COD Amount",
                  "Assigned Driver",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d._id} className="border-t border-slate-100">
                  <td className="px-5 py-3">{d._id.slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-3">{d.customerName}</td>
                  <td className="px-5 py-3">{d.customerPhone}</td>
                  <td className="px-5 py-3">
                    {d.codAmount ? `$${d.codAmount.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3">—</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset ${
                        d.status === "delivered"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : d.status === "in_transit"
                          ? "bg-blue-50 text-blue-700 ring-blue-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#0EA5E9]">View</td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && (
            <div className="p-4 text-sm text-slate-500">
              Loading deliveries…
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function InternalTab() {
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [counts, setCounts] = useState({
    activeDrivers: 0,
    assigned: 0,
    inTransit: 0,
    deliveredToday: 0,
  });
  const [rows, setRows] = useState<DeliveryRow[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/deliveries/stats?payment=prepaid")
      .then((r) => r.json())
      .then(
        (d) =>
          mounted &&
          setCounts((c) => ({
            ...c,
            assigned: d.assigned ?? 0,
            inTransit: d.inTransit ?? 0,
            deliveredToday: d.deliveredToday ?? 0,
          }))
      );
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        if (!mounted) return;
        type U = { role: string; isActive: boolean };
        const users: U[] = d.users || [];
        const activeDrivers = users.filter(
          (u) => u.role === "driver" && u.isActive
        ).length;
        setCounts((c) => ({ ...c, activeDrivers }));
      });
    const url = new URL("/api/deliveries", window.location.origin);
    url.searchParams.set("payment", "prepaid");
    if (statusFilter) url.searchParams.set("status", statusFilter);
    fetch(url.toString())
      .then((r) => r.json())
      .then((d) => mounted && setRows(d.deliveries ?? []));
    return () => {
      mounted = false;
    };
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r._id.slice(-8), r.customerName, r.deliveryAddress, r.status]
        .filter(Boolean)
        .some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [rows, query]);

  async function handleAddDriver() {
    if (!driverName || !driverPhone) {
      alert("Driver name and phone are required");
      return;
    }
    const parts = driverName.trim().split(/\s+/);
    const firstName = parts.shift() || "";
    const lastName = parts.join(" ");
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName: lastName || undefined,
          phone: driverPhone,
          email: `${Date.now()}+driver@placeholder.local`,
          role: "driver",
          password: Math.random().toString(36).slice(2, 10) + "A1",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? "Failed to add driver");
        return;
      }
      setDriverName("");
      setDriverPhone("");
      setEmployeeId("");
      setVehicleType("");
      alert("Driver created");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <div className="text-[13px] text-slate-500">Active Drivers</div>
          <div className="mt-2 text-2xl font-semibold">
            {counts.activeDrivers}
          </div>
        </Card>
        <Card>
          <div className="text-[13px] text-slate-500">Assigned Deliveries</div>
          <div className="mt-2 text-2xl font-semibold">{counts.assigned}</div>
        </Card>
        <Card>
          <div className="text-[13px] text-slate-500">In Transit</div>
          <div className="mt-2 text-2xl font-semibold">{counts.inTransit}</div>
        </Card>
        <Card>
          <div className="text-[13px] text-slate-500">Completed Today</div>
          <div className="mt-2 text-2xl font-semibold">
            {counts.deliveredToday}
          </div>
        </Card>
      </div>
      <Card
        header={<div className="font-semibold">Add New Internal Driver</div>}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Input
            placeholder="Driver Name"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
          />
          <Input
            placeholder="Phone Number"
            value={driverPhone}
            onChange={(e) => setDriverPhone(e.target.value)}
          />
          <Input
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
          <Select
            value={vehicleType}
            onChange={(e) =>
              setVehicleType((e.target as HTMLSelectElement).value)
            }
          >
            <option value="">Select vehicle type</option>
            <option value="car">Car</option>
            <option value="bike">Bike</option>
            <option value="van">Van</option>
            <option value="truck">Truck</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleAddDriver} disabled={submitting}>
            {submitting ? "Adding…" : "Add Driver"}
          </Button>
        </div>
      </Card>

      <Card
        header={<div className="font-semibold">Internal Driver Deliveries</div>}
        padded={false}
      >
        <div className="p-5 flex items-center gap-4">
          <Select
            className="w-40"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter((e.target as HTMLSelectElement).value)
            }
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="returned">Returned</option>
          </Select>
          <Input
            className="ml-auto w-80"
            leftIcon={<SearchIcon size={16} />}
            placeholder="Search by driver or order..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-[13px] text-slate-500">
                {[
                  "Order ID",
                  "Customer",
                  "Assigned Driver",
                  "Delivery Address",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d._id} className="border-t border-slate-100">
                  <td className="px-5 py-3">{d._id.slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-3">{d.customerName}</td>
                  <td className="px-5 py-3">—</td>
                  <td className="px-5 py-3">{d.deliveryAddress}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset ${
                        d.status === "delivered"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : d.status === "in_transit"
                          ? "bg-blue-50 text-blue-700 ring-blue-200"
                          : d.status === "assigned"
                          ? "bg-purple-50 text-purple-700 ring-purple-200"
                          : d.status === "returned"
                          ? "bg-red-50 text-red-700 ring-red-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#0EA5E9]">View</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
