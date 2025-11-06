"use client";

import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Tabs from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { PlusIcon, SearchIcon, DownloadIcon } from "@/components/icons";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";

const tabs = [
  { key: "cod", label: "COD Deliveries" },
  { key: "internal", label: "Internal Deliveries" },
  { key: "courier", label: "Courier Deliveries" },
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

      {tab === "cod" ? (
        <CODTab />
      ) : tab === "internal" ? (
        <InternalTab />
      ) : (
        <CourierTab />
      )}
    </div>
  );
}

type DeliveryRow = {
  _id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  customerStoreName?: string; // Store name for customer tracking
  deliveryAddress: string;
  deliveryCity?: string;
  codAmount?: number;
  status: string;
  createdAt: string;
  assignedDriverId?: {
    firstName?: string;
    lastName?: string;
  };
  assignedCourierId?: {
    firstName?: string;
    lastName?: string;
    courierCompanyName?: string;
  };
};

function CODTab() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [rows, setRows] = useState<DeliveryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  type CourierLite = {
    _id: string;
    firstName?: string;
    lastName?: string;
    courierCompanyName?: string;
    isActive?: boolean;
    role?: string;
  };
  const [couriers, setCouriers] = useState<CourierLite[]>([]);
  const [couriersLoading, setCouriersLoading] = useState(false);
  const [selectedCourierId, setSelectedCourierId] = useState<string>("");
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
    customerStoreName?: string; // Store name for customer tracking
    deliveryAddress: string;
    deliveryCity?: string;
    paymentMethod?: string;
    deliveryFee?: number;
    codAmount?: number;
    returnOrderRate?: number;
    priority?: string;
    status: string;
    deliveryDate?: Date;
    assignedDriverId?: {
      firstName?: string;
      lastName?: string;
    };
    notes?: string;
  };
  const [viewDelivery, setViewDelivery] = useState<DeliveryDetail | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const url = new URL("/api/deliveries", window.location.origin);
    url.searchParams.set("tab", "cod");
    if (statusFilter) url.searchParams.set("status", statusFilter);

    fetch(url.toString())
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
    // load active couriers for dropdown
    setCouriersLoading(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then((d: { users?: CourierLite[] }) => {
        if (!mounted) return;
        const driverList: CourierLite[] = (d.users || []).filter(
          (u) => u.role === "driver" && u.isActive
        );
        const courierList: CourierLite[] = (d.users || []).filter(
          (u) => u.role === "courier" && u.isActive
        );
        setCouriers([...courierList, ...driverList]);
      })
      .finally(() => {
        if (mounted) {
          setCouriersLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.reference,
        r.customerName,
        r.customerPhone,
        r.customerStoreName,
        r.deliveryAddress,
      ].some((v) => (v || "").toLowerCase().includes(q))
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

  function openEditDelivery(id: string) {
    router.push(`/admin/deliveries/${id}`);
  }

  async function downloadDeliveries(format: "csv" | "xlsx") {
    if (filtered.length === 0) {
      showError("Download Error", "No data to download");
      return;
    }

    // Prepare headers
    const headers = [
      "Reference ID",
      "Customer Name",
      "Store Name",
      "Phone",
      "COD Amount",
      "Delivery Address",
      "Status",
      "Assigned Driver/Courier",
      "Created Date",
    ];

    // Prepare data
    const data = filtered.map((d) => [
      d.reference,
      d.customerName,
      d.customerStoreName || "",
      d.customerPhone,
      d.codAmount ? `SAR ${d.codAmount.toFixed(2)}` : "",
      d.deliveryAddress,
      d.status.replace("_", " "),
      d.assignedDriverId
        ? `${d.assignedDriverId.firstName || ""} ${
            d.assignedDriverId.lastName || ""
          }`.trim()
        : "",
      new Date(d.createdAt).toLocaleDateString(),
    ]);

    if (format === "csv") {
      // Create CSV content
      const csvContent = [headers, ...data]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      // Download CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cod_deliveries_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === "xlsx") {
      try {
        // Use proper Excel export with exceljs
        const ExcelModule = await import("exceljs");
        const workbook = new ExcelModule.Workbook();
        const worksheet = workbook.addWorksheet("COD Deliveries");

        worksheet.columns = [
          { header: "Reference ID", key: "reference", width: 18 },
          { header: "Customer Name", key: "customerName", width: 24 },
          { header: "Store Name", key: "customerStoreName", width: 24 },
          { header: "Phone", key: "customerPhone", width: 16 },
          { header: "COD Amount", key: "codAmount", width: 14 },
          { header: "Delivery Address", key: "deliveryAddress", width: 40 },
          { header: "Status", key: "status", width: 14 },
          {
            header: "Assigned Driver/Courier",
            key: "assignedDriver",
            width: 20,
          },
          { header: "Created Date", key: "createdAt", width: 16 },
        ];

        filtered.forEach((d) => {
          worksheet.addRow({
            reference: d.reference,
            customerName: d.customerName,
            customerStoreName: d.customerStoreName || "",
            customerPhone: d.customerPhone,
            codAmount: d.codAmount || 0,
            deliveryAddress: d.deliveryAddress,
            status: d.status.replace("_", " "),
            assignedDriver: d.assignedDriverId
              ? `${d.assignedDriverId.firstName || ""} ${
                  d.assignedDriverId.lastName || ""
                }`.trim()
              : "",
            createdAt: new Date(d.createdAt).toLocaleDateString(),
          });
        });

        // Style header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };

        const arrayBuffer = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
        const body = new Uint8Array(arrayBuffer);

        // Download Excel file
        const blob = new Blob([body], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cod_deliveries_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        showError("Export Error", "Failed to generate Excel file");
        console.error("Excel export error:", error);
      }
    }
  }

  async function handleDeleteDelivery(id: string) {
    if (!confirm("Are you sure you want to delete this delivery?")) return;
    try {
      const res = await fetch(`/api/deliveries/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError("Delete Failed", data?.error ?? "Failed to delete");
        return;
      }
      setRows((prev) => prev.filter((r) => r._id !== id));
      showSuccess("Deleted", "Delivery deleted successfully");
    } catch {
      showError("Delete Failed", "Failed to delete");
    }
  }

  async function handleCourierAssignment() {
    if (!selectedCourierId || selectedIds.size === 0) return;

    try {
      const res = await fetch("/api/deliveries/assign-courier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryIds: Array.from(selectedIds),
          courierId: selectedCourierId,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(
          "Assignment Failed",
          data?.error ?? "Failed to assign parcels to courier"
        );
        return;
      }

      // Update local state - mark assigned parcels as assigned
      setRows((prev) =>
        prev.map((r) =>
          selectedIds.has(r._id) ? { ...r, status: "assigned" } : r
        )
      );

      showSuccess(
        "Assignment Successful",
        `Successfully assigned ${data.updatedCount} parcel${
          data.updatedCount > 1 ? "s" : ""
        } to ${data.courierName}`
      );

      setSelectedIds(new Set());
      setSelectedCourierId("");

      // Refresh counts
      fetch("/api/deliveries/stats?tab=cod")
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
    } catch {
      showError("Assignment Failed", "Failed to assign parcels to courier");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 cursor-pointer">
        <Button
          onClick={() => {
            router.push("/admin/deliveries/new");
          }}
          leftIcon={<PlusIcon size={18} />}
        >
          Add New Delivery
        </Button>
        <Button
          variant="secondary"
          onClick={() => downloadDeliveries("csv")}
          leftIcon={<DownloadIcon size={18} />}
        >
          Download CSV
        </Button>
        <Button
          variant="secondary"
          onClick={() => downloadDeliveries("xlsx")}
          leftIcon={<DownloadIcon size={18} />}
        >
          Download XLSX
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
          <Select
            className="w-full md:w-40"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter((e.target as HTMLSelectElement).value)
            }
          >
            <option value="">All Statuses</option>
            <option value="pending">To be picked Up</option>
            <option value="assigned">Assigned</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="future_delivery">Future Delivery</option>
            <option value="returned">RTOs</option>
            <option value="lost_damaged">Lost & Damages</option>
          </Select>
          <Input
            className="w-full md:ml-auto md:w-80"
            leftIcon={<SearchIcon size={16} />}
            placeholder="Search deliveries..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Courier Assignment Section */}
        {selectedIds.size > 0 && (
          <div className="px-5 pb-5 border-t border-slate-100">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="text-[13px] text-slate-500 whitespace-nowrap">
                {selectedIds.size} parcel{selectedIds.size > 1 ? "s" : ""}{" "}
                selected
              </div>
              <Select
                className="w-full md:w-56"
                value={selectedCourierId}
                onChange={(e) =>
                  setSelectedCourierId((e.target as HTMLSelectElement).value)
                }
              >
                <option value="" disabled>
                  {couriersLoading
                    ? "Loading couriers…"
                    : "Assign to driver / courier"}
                </option>
                {couriers.map((c: CourierLite) => (
                  <option key={c._id} value={c._id}>
                    {c.courierCompanyName ||
                      `${c.firstName || ""} ${c.lastName || ""}`.trim() ||
                      c._id}
                  </option>
                ))}
              </Select>
              <Button
                disabled={!selectedCourierId || selectedIds.size === 0}
                onClick={handleCourierAssignment}
                className="w-full md:w-auto whitespace-nowrap"
              >
                Assign to Driver / Courier
              </Button>
            </div>
          </div>
        )}

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
                  "Reference ID",
                  "Customer",
                  "Store Name",
                  "Phone",
                  "COD Amount",
                  "Delivery City",
                  "Assigned Driver/Courier",
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
                  <td className="px-5 py-3 uppercase">{d.reference}</td>
                  <td className="px-5 py-3">{d.customerName}</td>
                  <td className="px-5 py-3">{d.customerStoreName || "—"}</td>
                  <td className="px-5 py-3">{d.customerPhone}</td>
                  <td className="px-5 py-3">
                    {d.codAmount ? `SAR ${d.codAmount.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3">{d.deliveryCity}</td>
                  <td className="px-5 py-3">
                    {d.assignedDriverId?.firstName || "—"}{" "}
                    {d.assignedDriverId?.lastName || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset capitalize ${
                        d.status === "delivered"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : d.status === "in_transit"
                          ? "bg-blue-50 text-blue-700 ring-blue-200"
                          : d.status === "returned" || d.status === "rto"
                          ? "bg-red-50 text-red-700 ring-red-200"
                          : d.status === "lost_damaged"
                          ? "bg-gray-50 text-gray-700 ring-gray-200"
                          : d.status === "future_delivery"
                          ? "bg-purple-50 text-purple-700 ring-purple-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}
                    >
                      {d.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openViewDelivery(d._id)}
                        className="text-[#0EA5E9] hover:underline"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEditDelivery(d._id)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      {d.status === "pending" && (
                        <button
                          onClick={() => handleDeleteDelivery(d._id)}
                          className="text-rose-600 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
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
                <div className="font-medium">{String(viewDelivery?._id)}</div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Reference</div>
                <div className="font-medium uppercase">
                  {viewDelivery?.reference || "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Customer</div>
                <div className="font-medium">{viewDelivery?.customerName}</div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Store Name</div>
                <div className="font-medium">
                  {viewDelivery?.customerStoreName || "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Phone</div>
                <div className="font-medium">{viewDelivery?.customerPhone}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[12px] text-slate-500">Delivery City</div>
                <div className="font-medium">{viewDelivery?.deliveryCity}</div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Payment</div>
                <div className="font-medium">{viewDelivery?.paymentMethod}</div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Delivery Fee</div>
                <div className="font-medium">
                  {viewDelivery?.deliveryFee
                    ? `SAR ${Number(viewDelivery.deliveryFee).toFixed(2)}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">COD Amount</div>
                <div className="font-medium">
                  {viewDelivery?.codAmount
                    ? `SAR ${Number(viewDelivery.codAmount).toFixed(2)}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">RTO Amount</div>
                <div className="font-medium">
                  {viewDelivery?.returnOrderRate
                    ? `SAR ${Number(viewDelivery.returnOrderRate).toFixed(2)}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Priority</div>
                <div className="font-medium">
                  {viewDelivery?.priority || "standard"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Status</div>
                <div className="font-medium capitalize">
                  {viewDelivery?.status.replace("_", " ")}
                </div>
              </div>
              {viewDelivery?.deliveryDate && (
                <div>
                  <div className="text-[12px] text-slate-500">
                    Delivery Date
                  </div>
                  <div className="font-medium">
                    {new Date(viewDelivery.deliveryDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </div>
                </div>
              )}
              <div className="md:col-span-2">
                <div className="text-[12px] text-slate-500">
                  Assigned Driver/Courier
                </div>
                <div className="font-medium">
                  {viewDelivery?.assignedDriverId?.firstName || "—"}{" "}
                  {viewDelivery?.assignedDriverId?.lastName || "—"}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[12px] text-slate-500">Notes</div>
                <div className="font-medium">{viewDelivery?.notes || "—"}</div>
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
  const router = useRouter();
  const { showError, showSuccess } = useToast();

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
    | "returned"
    | "future_delivery"
    | "rto"
    | "lost_damaged";
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
    customerStoreName?: string; // Store name for customer tracking
    deliveryAddress: string;
    paymentMethod?: string;
    deliveryFee?: number;
    codAmount?: number;
    returnOrderRate?: number;
    priority?: string;
    status: string;
    deliveryDate?: Date;
    assignedDriverId?: {
      firstName?: string;
      lastName?: string;
    };
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
      [
        r.reference,
        r.customerName,
        r.customerStoreName,
        r.deliveryAddress,
        r.status,
      ]
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

  function openEditDelivery(id: string) {
    router.push(`/admin/deliveries/${id}`);
  }

  async function handleDeleteDelivery(id: string) {
    if (!confirm("Are you sure you want to delete this delivery?")) return;
    try {
      const res = await fetch(`/api/deliveries/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError("Delete Failed", data?.error ?? "Failed to delete");
        return;
      }
      setRows((prev) => prev.filter((r) => r._id !== id));
      showSuccess("Deleted", "Delivery deleted successfully");
    } catch {
      showError("Delete Failed", "Failed to delete");
    }
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
              .join(" • ");
          });
          showError("Validation Error", errorMessage.join(" • "));
        } else {
          showError("Update Failed", "Failed to update status");
        }
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          selectedIds.has(r._id) ? { ...r, status: bulkStatus } : r
        )
      );
      showSuccess(
        "Status Updated",
        `Successfully updated ${selectedIds.size} deliveries`
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

  async function downloadDeliveries(format: "csv" | "xlsx") {
    if (filtered.length === 0) {
      showError("Download Error", "No data to download");
      return;
    }

    // Prepare headers
    const headers = [
      "Reference ID",
      "Customer Name",
      "Store Name",
      "Phone",
      "COD Amount",
      "Delivery Address",
      "Status",
      "Assigned Driver",
      "Created Date",
    ];

    // Prepare data
    const data = filtered.map((d) => [
      d.reference,
      d.customerName,
      d.customerStoreName || "",
      d.customerPhone,
      d.codAmount ? `SAR ${d.codAmount.toFixed(2)}` : "",
      d.deliveryAddress,
      d.status.replace("_", " "),
      d.assignedDriverId
        ? `${d.assignedDriverId.firstName || ""} ${
            d.assignedDriverId.lastName || ""
          }`.trim()
        : "",
      new Date(d.createdAt).toLocaleDateString(),
    ]);

    if (format === "csv") {
      // Create CSV content
      const csvContent = [headers, ...data]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      // Download CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `internal_deliveries_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === "xlsx") {
      try {
        // Use proper Excel export with exceljs
        const ExcelModule = await import("exceljs");
        const workbook = new ExcelModule.Workbook();
        const worksheet = workbook.addWorksheet("Internal Deliveries");

        worksheet.columns = [
          { header: "Reference ID", key: "reference", width: 18 },
          { header: "Customer Name", key: "customerName", width: 24 },
          { header: "Store Name", key: "customerStoreName", width: 24 },
          { header: "Phone", key: "customerPhone", width: 16 },
          { header: "COD Amount", key: "codAmount", width: 14 },
          { header: "Delivery Address", key: "deliveryAddress", width: 40 },
          { header: "Status", key: "status", width: 14 },
          {
            header: "Assigned Driver",
            key: "assignedDriver",
            width: 20,
          },
          { header: "Created Date", key: "createdAt", width: 16 },
        ];

        filtered.forEach((d) => {
          worksheet.addRow({
            reference: d.reference,
            customerName: d.customerName,
            customerStoreName: d.customerStoreName || "",
            customerPhone: d.customerPhone,
            codAmount: d.codAmount ? `SAR ${d.codAmount.toFixed(2)}` : "",
            deliveryAddress: d.deliveryAddress,
            status: d.status.replace("_", " "),
            assignedDriver: d.assignedDriverId
              ? `${d.assignedDriverId.firstName || ""} ${
                  d.assignedDriverId.lastName || ""
                }`.trim()
              : "",
            createdAt: new Date(d.createdAt).toLocaleDateString(),
          });
        });

        // Style the header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE2E8F0" },
        };

        // Generate and download the file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `internal_deliveries_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Excel export error:", error);
        showError("Export Error", "Failed to export Excel file");
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 mb-4">
        <Button
          onClick={() => {
            router.push("/admin/deliveries/new");
          }}
          leftIcon={<PlusIcon size={18} />}
        >
          Add New Delivery
        </Button>
        <Button
          variant="secondary"
          onClick={() => downloadDeliveries("csv")}
          leftIcon={<DownloadIcon size={18} />}
        >
          Download CSV
        </Button>
        <Button
          variant="secondary"
          onClick={() => downloadDeliveries("xlsx")}
          leftIcon={<DownloadIcon size={18} />}
        >
          Download XLSX
        </Button>
      </div>
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
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (value.length <= 9) {
                setDriverPhone(value);
              }
            }}
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
            <option value="pending">To be picked Up</option>
            <option value="assigned">Assigned</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="future_delivery">Future Delivery</option>
            <option value="returned">RTOs</option>
            <option value="lost_damaged">Lost & Damages</option>
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
              <option value="pending">To be picked Up</option>
              <option value="assigned">Assigned</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="future_delivery">Future Delivery</option>
              <option value="returned">RTOs</option>
              <option value="lost_damaged">Lost & Damages</option>
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
                  "Reference ID",
                  "Customer",
                  "Store Name",
                  "Assigned Driver/Courier",
                  "Delivery City",
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
                  <td className="px-5 py-3 uppercase">{d.reference}</td>
                  <td className="px-5 py-3">{d.customerName}</td>
                  <td className="px-5 py-3">{d.customerStoreName || "—"}</td>
                  <td className="px-5 py-3">
                    {d.assignedDriverId?.firstName || "—"}{" "}
                    {d.assignedDriverId?.lastName || "—"}
                  </td>
                  <td className="px-5 py-3">{d.deliveryCity}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset capitalize ${
                        d.status === "delivered"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : d.status === "in_transit"
                          ? "bg-blue-50 text-blue-700 ring-blue-200"
                          : d.status === "assigned"
                          ? "bg-purple-50 text-purple-700 ring-purple-200"
                          : d.status === "returned" || d.status === "rto"
                          ? "bg-red-50 text-red-700 ring-red-200"
                          : d.status === "lost_damaged"
                          ? "bg-gray-50 text-gray-700 ring-gray-200"
                          : d.status === "future_delivery"
                          ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}
                    >
                      {d.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openViewDelivery(d._id)}
                        className="text-[#0EA5E9] hover:underline"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEditDelivery(d._id)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      {d.status === "pending" && (
                        <button
                          onClick={() => handleDeleteDelivery(d._id)}
                          className="text-rose-600 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
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
                <div className="font-medium">{String(viewDelivery?._id)}</div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Reference</div>
                <div className="font-medium uppercase">
                  {viewDelivery?.reference || "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Customer</div>
                <div className="font-medium">{viewDelivery?.customerName}</div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Store Name</div>
                <div className="font-medium">
                  {viewDelivery?.customerStoreName || "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Phone</div>
                <div className="font-medium">{viewDelivery?.customerPhone}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[12px] text-slate-500">
                  Delivery Address
                </div>
                <div className="font-medium">
                  {viewDelivery?.deliveryAddress}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Payment</div>
                <div className="font-medium">{viewDelivery?.paymentMethod}</div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Delivery Fee</div>
                <div className="font-medium">
                  {viewDelivery?.deliveryFee
                    ? `SAR ${Number(viewDelivery.deliveryFee).toFixed(2)}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">COD Amount</div>
                <div className="font-medium">
                  {viewDelivery?.codAmount
                    ? `SAR ${Number(viewDelivery.codAmount).toFixed(2)}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">RTO Amount</div>
                <div className="font-medium">
                  {viewDelivery?.returnOrderRate
                    ? `SAR ${Number(viewDelivery.returnOrderRate).toFixed(2)}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Priority</div>
                <div className="font-medium">
                  {viewDelivery?.priority || "standard"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Status</div>
                <div className="font-medium capitalize">
                  {viewDelivery?.status.replace("_", " ")}
                </div>
              </div>
              {viewDelivery?.deliveryDate && (
                <div>
                  <div className="text-[12px] text-slate-500">
                    Delivery Date
                  </div>
                  <div className="font-medium">
                    {new Date(viewDelivery.deliveryDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </div>
                </div>
              )}
              <div className="md:col-span-2">
                <div className="text-[12px] text-slate-500">
                  Assigned Driver/Courier
                </div>
                <div className="font-medium">
                  {viewDelivery?.assignedDriverId?.firstName || "—"}{" "}
                  {viewDelivery?.assignedDriverId?.lastName || "—"}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[12px] text-slate-500">Notes</div>
                <div className="font-medium">{viewDelivery?.notes || "—"}</div>
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

function CourierTab() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();

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
    | "returned"
    | "future_delivery"
    | "rto"
    | "lost_damaged";
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
    customerStoreName?: string; // Store name for customer tracking
    deliveryAddress: string;
    paymentMethod?: string;
    deliveryFee?: number;
    codAmount?: number;
    returnOrderRate?: number;
    priority?: string;
    status: string;
    deliveryDate?: Date;
    assignedDriverId?: {
      firstName?: string;
      lastName?: string;
    };
    notes?: string;
  };
  const [viewDelivery, setViewDelivery] = useState<DeliveryDetail | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/deliveries/stats?tab=courier")
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
          (u) => u.role === "courier" && u.isActive
        ).length;
        setCounts((c) => ({ ...c, activeDrivers }));
      });
    const url = new URL("/api/deliveries", window.location.origin);
    url.searchParams.set("tab", "courier");
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
      [
        r.reference,
        r.customerName,
        r.customerStoreName,
        r.deliveryCity,
        r.status,
      ]
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

  function openEditDelivery(id: string) {
    router.push(`/admin/deliveries/${id}`);
  }

  async function handleDeleteDelivery(id: string) {
    if (!confirm("Are you sure you want to delete this delivery?")) return;
    try {
      const res = await fetch(`/api/deliveries/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError("Delete Failed", data?.error ?? "Failed to delete");
        return;
      }
      setRows((prev) => prev.filter((r) => r._id !== id));
      showSuccess("Deleted", "Delivery deleted successfully");
    } catch {
      showError("Delete Failed", "Failed to delete");
    }
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
              .join(" • ");
          });
          showError("Validation Error", errorMessage.join(" • "));
        } else {
          showError("Update Failed", "Failed to update status");
        }
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          selectedIds.has(r._id) ? { ...r, status: bulkStatus } : r
        )
      );
      showSuccess(
        "Status Updated",
        `Successfully updated ${selectedIds.size} deliveries`
      );
      setSelectedIds(new Set());
      // Optionally refresh counts
      fetch("/api/deliveries/stats?tab=courier")
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

  async function downloadDeliveries(format: "csv" | "xlsx") {
    if (filtered.length === 0) {
      showError("Download Error", "No data to download");
      return;
    }

    // Prepare headers
    const headers = [
      "Reference ID",
      "Customer Name",
      "Store Name",
      "Phone",
      "COD Amount",
      "Delivery Address",
      "Status",
      "Assigned Courier",
      "Created Date",
    ];

    // Prepare data
    const data = filtered.map((d) => [
      d.reference,
      d.customerName,
      d.customerStoreName || "",
      d.customerPhone,
      d.codAmount ? `SAR ${d.codAmount.toFixed(2)}` : "",
      d.deliveryAddress,
      d.status.replace("_", " "),
      d.assignedDriverId
        ? `${d.assignedDriverId.firstName || ""} ${
            d.assignedDriverId.lastName || ""
          }`.trim()
        : "",
      new Date(d.createdAt).toLocaleDateString(),
    ]);

    if (format === "csv") {
      // Create CSV content
      const csvContent = [headers, ...data]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      // Download CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `courier_deliveries_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === "xlsx") {
      try {
        // Use proper Excel export with exceljs
        const ExcelModule = await import("exceljs");
        const workbook = new ExcelModule.Workbook();
        const worksheet = workbook.addWorksheet("Courier Deliveries");

        worksheet.columns = [
          { header: "Reference ID", key: "reference", width: 18 },
          { header: "Customer Name", key: "customerName", width: 24 },
          { header: "Store Name", key: "customerStoreName", width: 24 },
          { header: "Phone", key: "customerPhone", width: 16 },
          { header: "COD Amount", key: "codAmount", width: 14 },
          { header: "Delivery Address", key: "deliveryAddress", width: 40 },
          { header: "Status", key: "status", width: 14 },
          {
            header: "Assigned Courier",
            key: "assignedDriver",
            width: 20,
          },
          { header: "Created Date", key: "createdAt", width: 16 },
        ];

        filtered.forEach((d) => {
          worksheet.addRow({
            reference: d.reference,
            customerName: d.customerName,
            customerStoreName: d.customerStoreName || "",
            customerPhone: d.customerPhone,
            codAmount: d.codAmount ? `SAR ${d.codAmount.toFixed(2)}` : "",
            deliveryAddress: d.deliveryAddress,
            status: d.status.replace("_", " "),
            assignedDriver: d.assignedDriverId
              ? `${d.assignedDriverId.firstName || ""} ${
                  d.assignedDriverId.lastName || ""
                }`.trim()
              : "",
            createdAt: new Date(d.createdAt).toLocaleDateString(),
          });
        });

        // Style the header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE2E8F0" },
        };

        // Generate and download the file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `courier_deliveries_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Excel export error:", error);
        showError("Export Error", "Failed to export Excel file");
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 mb-4">
        <Button
          onClick={() => {
            router.push("/admin/deliveries/new");
          }}
          leftIcon={<PlusIcon size={18} />}
        >
          Add New Delivery
        </Button>
        <Button
          variant="secondary"
          onClick={() => downloadDeliveries("csv")}
          leftIcon={<DownloadIcon size={18} />}
        >
          Download CSV
        </Button>
        <Button
          variant="secondary"
          onClick={() => downloadDeliveries("xlsx")}
          leftIcon={<DownloadIcon size={18} />}
        >
          Download XLSX
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <div className="text-[13px] text-slate-500">Active Couriers</div>
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
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (value.length <= 9) {
                setDriverPhone(value);
              }
            }}
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
        header={<div className="font-semibold">Courier Deliveries</div>}
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
            <option value="pending">To be picked Up</option>
            <option value="assigned">Assigned</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="future_delivery">Future Delivery</option>
            <option value="returned">RTOs</option>
            <option value="lost_damaged">Lost & Damages</option>
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
              <option value="pending">To be picked Up</option>
              <option value="assigned">Assigned</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="future_delivery">Future Delivery</option>
              <option value="returned">RTOs</option>
              <option value="lost_damaged">Lost & Damages</option>
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
                  "Reference ID",
                  "Customer",
                  "Store Name",
                  "Assigned Courier",
                  "Delivery City",
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
                  <td className="px-5 py-3 uppercase">{d.reference}</td>
                  <td className="px-5 py-3">{d.customerName}</td>
                  <td className="px-5 py-3">{d.customerStoreName || "—"}</td>
                  <td className="px-5 py-3">
                    {d.assignedDriverId?.firstName || "—"}{" "}
                    {d.assignedDriverId?.lastName || "—"}
                  </td>
                  <td className="px-5 py-3">{d.deliveryCity}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset capitalize ${
                        d.status === "delivered"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : d.status === "in_transit"
                          ? "bg-blue-50 text-blue-700 ring-blue-200"
                          : d.status === "assigned"
                          ? "bg-purple-50 text-purple-700 ring-purple-200"
                          : d.status === "returned" || d.status === "rto"
                          ? "bg-red-50 text-red-700 ring-red-200"
                          : d.status === "lost_damaged"
                          ? "bg-gray-50 text-gray-700 ring-gray-200"
                          : d.status === "future_delivery"
                          ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}
                    >
                      {d.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openViewDelivery(d._id)}
                        className="text-[#0EA5E9] hover:underline"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEditDelivery(d._id)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      {d.status === "pending" && (
                        <button
                          onClick={() => handleDeleteDelivery(d._id)}
                          className="text-rose-600 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
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
                <div className="font-medium">{String(viewDelivery?._id)}</div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Reference</div>
                <div className="font-medium uppercase">
                  {viewDelivery?.reference || "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Customer</div>
                <div className="font-medium">{viewDelivery?.customerName}</div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Store Name</div>
                <div className="font-medium">
                  {viewDelivery?.customerStoreName || "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Phone</div>
                <div className="font-medium">{viewDelivery?.customerPhone}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[12px] text-slate-500">
                  Delivery Address
                </div>
                <div className="font-medium">
                  {viewDelivery?.deliveryAddress}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Payment</div>
                <div className="font-medium">{viewDelivery?.paymentMethod}</div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Delivery Fee</div>
                <div className="font-medium">
                  {viewDelivery?.deliveryFee
                    ? `SAR ${Number(viewDelivery.deliveryFee).toFixed(2)}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">COD Amount</div>
                <div className="font-medium">
                  {viewDelivery?.codAmount
                    ? `SAR ${Number(viewDelivery.codAmount).toFixed(2)}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">RTO Amount</div>
                <div className="font-medium">
                  {viewDelivery?.returnOrderRate
                    ? `SAR ${Number(viewDelivery.returnOrderRate).toFixed(2)}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Priority</div>
                <div className="font-medium">
                  {viewDelivery?.priority || "standard"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Status</div>
                <div className="font-medium capitalize">
                  {viewDelivery?.status.replace("_", " ")}
                </div>
              </div>
              {viewDelivery?.deliveryDate && (
                <div>
                  <div className="text-[12px] text-slate-500">
                    Delivery Date
                  </div>
                  <div className="font-medium">
                    {new Date(viewDelivery.deliveryDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </div>
                </div>
              )}
              <div className="md:col-span-2">
                <div className="text-[12px] text-slate-500">
                  Assigned Driver/Courier
                </div>
                <div className="font-medium">
                  {viewDelivery?.assignedDriverId?.firstName || "—"}{" "}
                  {viewDelivery?.assignedDriverId?.lastName || "—"}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[12px] text-slate-500">Notes</div>
                <div className="font-medium">{viewDelivery?.notes || "—"}</div>
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
