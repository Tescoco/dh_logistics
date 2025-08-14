"use client";

import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Tabs from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { PlusIcon, UploadIcon, SearchIcon } from "@/components/icons";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const tabs = [
  { key: "cod", label: "COD Deliveries" },
  { key: "internal", label: "Internal Deliveries" },
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
  assignedDriverId?: string;
};

function CODTab() {
  const router = useRouter();
  const [rows, setRows] = useState<DeliveryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  type DeliveryStatus =
    | "pending"
    | "assigned"
    | "in_transit"
    | "delivered"
    | "returned";
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<DeliveryStatus | "">("");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  type DriverLite = {
    _id: string;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
    role?: string;
  };
  const [drivers, setDrivers] = useState<DriverLite[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [counts, setCounts] = useState({
    total: 0,
    pendingAssignment: 0,
    inTransit: 0,
    deliveredToday: 0,
  });

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  type DeliveryDetail = {
    _id: string;
    reference?: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    paymentMethod?: string;
    codAmount?: number;
    priority?: string;
    status: string;
    assignedDriverId?: string;
    notes?: string;
  };
  const [viewDelivery, setViewDelivery] = useState<DeliveryDetail | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch("/api/deliveries?tab=cod")
      .then((r) => r.json())
      .then((d) => mounted && setRows(d.deliveries ?? []))
      .finally(() => mounted && setLoading(false));
    fetch("/api/deliveries/stats?tab=cod")
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
    // load active drivers for dropdown
    setDriversLoading(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then((d: { users?: DriverLite[] }) => {
        if (!mounted) return;
        const list: DriverLite[] = (d.users || []).filter(
          (u) => u.role === "driver" && u.isActive
        );
        setDrivers(list);
      })
      .finally(() => mounted && setDriversLoading(false));
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

  const allVisibleSelected = useMemo(
    () => filtered.length > 0 && filtered.every((d) => selectedIds.has(d._id)),
    [filtered, selectedIds]
  );

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const ids = filtered.map((d) => d._id);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function openViewDelivery(id: string) {
    setViewOpen(true);
    setViewLoading(true);
    setViewDelivery(null);
    fetch(`/api/deliveries/${id}`)
      .then((r) => r.json())
      .then((d) => setViewDelivery((d.delivery as DeliveryDetail) ?? null))
      .finally(() => setViewLoading(false));
  }

  async function handleBulkUpdate() {
    if (!bulkStatus || selectedIds.size === 0) return;
    setBulkUpdating(true);
    try {
      const res = await fetch("/api/deliveries/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          status: bulkStatus,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Failed to update status");
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          selectedIds.has(r._id) ? { ...r, status: bulkStatus } : r
        )
      );
      setSelectedIds(new Set());
      // Optionally refresh counts
      fetch("/api/deliveries/stats?payment=cod")
        .then((r) => r.json())
        .then((d) =>
          setCounts({
            total: d.total ?? 0,
            pendingAssignment: d.pendingAssignment ?? 0,
            inTransit: d.inTransit ?? 0,
            deliveredToday: d.deliveredToday ?? 0,
          })
        )
        .catch(() => {});
    } finally {
      setBulkUpdating(false);
    }
  }

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

      {/* <Card header={<div className="font-semibold">Quick Add Delivery</div>}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <Input placeholder="Customer Name" />
          <Input placeholder="Customer Phone" />
          <Input placeholder="COD Amount" />
          <Input className="md:col-span-2" placeholder="Delivery Address" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
          <Select
            className="md:col-span-2"
            value={selectedDriverId}
            onChange={(e) =>
              setSelectedDriverId((e.target as HTMLSelectElement).value)
            }
          >
            <option value="" disabled>
              {driversLoading ? "Loading drivers…" : "Select COD Driver"}
            </option>
            {drivers.map((d: DriverLite) => (
              <option key={d._id} value={d._id}>
                {[d.firstName, d.lastName].filter(Boolean).join(" ") || d._id}
              </option>
            ))}
          </Select>
          <div className="md:col-span-3 flex justify-end">
            <Button>Add Delivery</Button>
          </div>
        </div>
      </Card> */}

      <Card
        header={<div className="font-semibold">COD Deliveries</div>}
        padded={false}
      >
        <div className="p-5 flex flex-col gap-3 md:flex-row md:items-center">
          <Select className="w-full md:w-40">
            <option>All Statuses</option>
          </Select>
          <Input
            className="w-full md:ml-auto md:w-80"
            leftIcon={<SearchIcon size={16} />}
            placeholder="Search deliveries..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2 md:ml-4 w-full md:w-auto">
            <div className="text-[13px] text-slate-500 whitespace-nowrap">
              {selectedIds.size} selected
            </div>
            <Select
              className="w-full md:w-44"
              value={bulkStatus}
              onChange={(e) =>
                setBulkStatus(
                  (e.target as HTMLSelectElement).value as DeliveryStatus
                )
              }
            >
              <option value="" disabled>
                Set status to…
              </option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="returned">Returned</option>
            </Select>
            <Button
              disabled={!bulkStatus || selectedIds.size === 0 || bulkUpdating}
              onClick={handleBulkUpdate}
              className="w-full md:w-auto whitespace-nowrap"
            >
              {bulkUpdating ? "Updating…" : "Update Status"}
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-[13px] text-slate-500">
                <th className="px-5 py-3 font-medium">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    aria-label="Select all visible"
                  />
                </th>
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
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(d._id)}
                      onChange={() => toggleSelectOne(d._id)}
                      aria-label={`Select ${d._id}`}
                    />
                  </td>
                  <td className="px-5 py-3">{d._id.slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-3">{d.customerName}</td>
                  <td className="px-5 py-3">{d.customerPhone}</td>
                  <td className="px-5 py-3">
                    {d.codAmount ? `$${d.codAmount.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {d.assignedDriverId
                      ? drivers.find(
                          (driver) => driver._id === d.assignedDriverId
                        )?.firstName +
                        " " +
                        drivers.find(
                          (driver) => driver._id === d.assignedDriverId
                        )?.lastName
                      : "—"}
                  </td>
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
                  <td className="px-5 py-3">
                    <button
                      onClick={() => openViewDelivery(d._id)}
                      className="text-[#0EA5E9] hover:underline"
                    >
                      View
                    </button>
                  </td>
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

      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Delivery Details"
        widthClassName="max-w-2xl"
      >
        {viewLoading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : viewDelivery ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="text-[12px] text-slate-500">Order ID</div>
                <div className="font-medium">{String(viewDelivery._id)}</div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Reference</div>
                <div className="font-medium">
                  {viewDelivery.reference || "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Customer</div>
                <div className="font-medium">{viewDelivery.customerName}</div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Phone</div>
                <div className="font-medium">{viewDelivery.customerPhone}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[12px] text-slate-500">
                  Delivery Address
                </div>
                <div className="font-medium">
                  {viewDelivery.deliveryAddress}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Payment</div>
                <div className="font-medium">{viewDelivery.paymentMethod}</div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">COD Amount</div>
                <div className="font-medium">
                  {viewDelivery.codAmount
                    ? `$${Number(viewDelivery.codAmount).toFixed(2)}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Priority</div>
                <div className="font-medium">
                  {viewDelivery.priority || "standard"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Status</div>
                <div className="font-medium">{viewDelivery.status}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[12px] text-slate-500">
                  Assigned Driver
                </div>
                <div className="font-medium">
                  {(() => {
                    const drv = drivers.find(
                      (x) => x._id === String(viewDelivery.assignedDriverId)
                    );
                    return drv
                      ? `${drv.firstName || ""} ${drv.lastName || ""}`.trim()
                      : "—";
                  })()}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[12px] text-slate-500">Notes</div>
                <div className="font-medium">{viewDelivery.notes || "—"}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Delivery not found</div>
        )}
      </Modal>
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
  type DeliveryStatus =
    | "pending"
    | "assigned"
    | "in_transit"
    | "delivered"
    | "returned";
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<DeliveryStatus | "">("");
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  type DeliveryDetail = {
    _id: string;
    reference?: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    paymentMethod?: string;
    codAmount?: number;
    priority?: string;
    status: string;
    assignedDriverId?: string;
    notes?: string;
  };
  const [viewDelivery, setViewDelivery] = useState<DeliveryDetail | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/deliveries/stats?tab=internal")
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
    url.searchParams.set("tab", "internal");
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

  const allVisibleSelected = useMemo(
    () => filtered.length > 0 && filtered.every((d) => selectedIds.has(d._id)),
    [filtered, selectedIds]
  );

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const ids = filtered.map((d) => d._id);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function openViewDelivery(id: string) {
    setViewOpen(true);
    setViewLoading(true);
    setViewDelivery(null);
    fetch(`/api/deliveries/${id}`)
      .then((r) => r.json())
      .then((d) => setViewDelivery((d.delivery as DeliveryDetail) ?? null))
      .finally(() => setViewLoading(false));
  }

  async function handleBulkUpdate() {
    if (!bulkStatus || selectedIds.size === 0) return;
    setBulkUpdating(true);
    try {
      const res = await fetch("/api/deliveries/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          status: bulkStatus,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.error.fieldErrors) {
          const fieldErrors = Object.values(data.error.fieldErrors);
          const errorMessage = fieldErrors.map((error) => {
            return Object.entries(error as Record<string, string>)
              .map(([key, value]) => `${key}: ${value}`)
              .join("\n");
          });
          alert(errorMessage.join("\n"));
        } else {
          alert("Failed to update status");
        }
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          selectedIds.has(r._id) ? { ...r, status: bulkStatus } : r
        )
      );
      setSelectedIds(new Set());
      // Optionally refresh counts
      fetch("/api/deliveries/stats?tab=internal")
        .then((r) => r.json())
        .then((d) =>
          setCounts((c) => ({
            ...c,
            assigned: d.assigned ?? 0,
            inTransit: d.inTransit ?? 0,
            deliveredToday: d.deliveredToday ?? 0,
          }))
        )
        .catch(() => {});
    } finally {
      setBulkUpdating(false);
    }
  }

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
      {/* <Card
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
      </Card> */}

      <Card
        header={<div className="font-semibold">Internal Driver Deliveries</div>}
        padded={false}
      >
        <div className="p-5 flex flex-col gap-3 md:flex-row md:items-center">
          <Select
            className="w-full md:w-40"
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
            className="w-full md:ml-auto md:w-80"
            leftIcon={<SearchIcon size={16} />}
            placeholder="Search by driver or order..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2 md:ml-4 w-full md:w-auto">
            <div className="text-[13px] text-slate-500 whitespace-nowrap">
              {selectedIds.size} selected
            </div>
            <Select
              className="w-full md:w-44"
              value={bulkStatus}
              onChange={(e) =>
                setBulkStatus(
                  (e.target as HTMLSelectElement).value as DeliveryStatus
                )
              }
            >
              <option value="" disabled>
                Set status to…
              </option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="returned">Returned</option>
            </Select>
            <Button
              disabled={!bulkStatus || selectedIds.size === 0 || bulkUpdating}
              onClick={handleBulkUpdate}
              className="w-full md:w-auto whitespace-nowrap"
            >
              {bulkUpdating ? "Updating…" : "Update Status"}
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-[13px] text-slate-500">
                <th className="px-5 py-3 font-medium">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    aria-label="Select all visible"
                  />
                </th>
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
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(d._id)}
                      onChange={() => toggleSelectOne(d._id)}
                      aria-label={`Select ${d._id}`}
                    />
                  </td>
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
                  <td className="px-5 py-3">
                    <button
                      onClick={() => openViewDelivery(d._id)}
                      className="text-[#0EA5E9] hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Delivery Details"
        widthClassName="max-w-2xl"
      >
        {viewLoading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : viewDelivery ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="text-[12px] text-slate-500">Order ID</div>
                <div className="font-medium">{String(viewDelivery._id)}</div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Reference</div>
                <div className="font-medium">
                  {viewDelivery.reference || "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Customer</div>
                <div className="font-medium">{viewDelivery.customerName}</div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Phone</div>
                <div className="font-medium">{viewDelivery.customerPhone}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[12px] text-slate-500">
                  Delivery Address
                </div>
                <div className="font-medium">
                  {viewDelivery.deliveryAddress}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Payment</div>
                <div className="font-medium">{viewDelivery.paymentMethod}</div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">COD Amount</div>
                <div className="font-medium">
                  {viewDelivery.codAmount
                    ? `$${Number(viewDelivery.codAmount).toFixed(2)}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Priority</div>
                <div className="font-medium">
                  {viewDelivery.priority || "standard"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Status</div>
                <div className="font-medium">{viewDelivery.status}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[12px] text-slate-500">
                  Assigned Driver
                </div>
                <div className="font-medium">—</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[12px] text-slate-500">Notes</div>
                <div className="font-medium">{viewDelivery.notes || "—"}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Delivery not found</div>
        )}
      </Modal>
    </div>
  );
}
