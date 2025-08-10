"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  SearchIcon,
  UploadIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  FilterIcon,
  ListIcon,
  CalendarIcon,
  XIcon,
} from "@/components/icons";

type DeliveryRow = {
  deliveryId: string;
  trackingId: string;
  customerName: string;
  customerEmail: string;
  status: "Delivered" | "In Transit" | "Pending" | "Returned" | "Assigned";
  origin: string;
  destination: string;
  date: string; // ISO string
  avatarHue: number; // HSL hue to generate a simple avatar color
};

type DeliveryApiLite = {
  _id?: string;
  reference?: string;
  customerName?: string;
  status?: "delivered" | "in_transit" | "pending" | "assigned" | "returned";
  senderAddress?: string;
  deliveryAddress?: string;
  createdAt?: string | Date;
};

export default function TrackDeliveriesPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [rows, setRows] = useState<DeliveryRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Bulk search state
  const [bulkSearchOpen, setBulkSearchOpen] = useState(false);
  const [bulkSearchQuery, setBulkSearchQuery] = useState("");

  // Advanced filters state
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [originFilter, setOriginFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const url = new URL("/api/deliveries", window.location.origin);
    if (statusFilter) url.searchParams.set("status", statusFilter);
    fetch(url.toString())
      .then((r) => r.json())
      .then((d) => {
        const serverRows: DeliveryRow[] = (
          (d.deliveries || []) as DeliveryApiLite[]
        )
          .slice(0, 100)
          .map((it: DeliveryApiLite, i: number) => ({
            deliveryId: String(it._id || ""),
            trackingId: it.reference || `SH-${String(i).padStart(3, "0")}`,
            customerName: it.customerName || "—",
            customerEmail: `${(it.customerName || "user")
              .split(" ")[0]
              .toLowerCase()}@example.com`,
            status:
              it.status === "delivered"
                ? "Delivered"
                : it.status === "in_transit"
                ? "In Transit"
                : it.status === "pending"
                ? "Pending"
                : it.status === "assigned"
                ? "Assigned"
                : "Returned",
            origin: it.senderAddress || "—",
            destination: it.deliveryAddress || "—",
            date: new Date(it.createdAt ?? Date.now())
              .toISOString()
              .slice(0, 10),
            avatarHue: (i * 47) % 360,
          }));
        setRows(serverRows);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const bulkIds = bulkSearchQuery
      .split(/[\n,\s]+/)
      .map((id) => id.trim().toLowerCase())
      .filter((id) => id.length > 0);

    return rows.filter((r) => {
      // Handle bulk search
      if (bulkIds.length > 0) {
        const matchesBulk = bulkIds.some((id) =>
          r.trackingId.toLowerCase().includes(id)
        );
        if (!matchesBulk) return false;
      }

      // Regular query search
      const matchesQuery = q
        ? [
            r.trackingId,
            r.customerName,
            r.customerEmail,
            r.origin,
            r.destination,
            r.status,
          ]
            .filter(Boolean)
            .some((v) => (v || "").toLowerCase().includes(q))
        : true;

      // Status filtering (support multiple statuses)
      const matchesStatus =
        selectedStatuses.length > 0
          ? selectedStatuses.some(
              (status) =>
                r.status.toLowerCase().replace(/\s+/g, "_") ===
                status.toLowerCase()
            )
          : statusFilter
          ? r.status.toLowerCase().replace(/\s+/g, "_") ===
            statusFilter.toLowerCase()
          : true;

      // Date filtering
      const matchesDate = date ? r.date === date : true;

      // Date range filtering
      const matchesDateRange = (() => {
        if (!dateFrom && !dateTo) return true;
        const rowDate = new Date(r.date);
        if (dateFrom && rowDate < new Date(dateFrom)) return false;
        if (dateTo && rowDate > new Date(dateTo)) return false;
        return true;
      })();

      // Origin filtering
      const matchesOrigin = originFilter
        ? r.origin.toLowerCase().includes(originFilter.toLowerCase())
        : true;

      // Destination filtering
      const matchesDestination = destinationFilter
        ? r.destination.toLowerCase().includes(destinationFilter.toLowerCase())
        : true;

      return (
        matchesQuery &&
        matchesStatus &&
        matchesDate &&
        matchesDateRange &&
        matchesOrigin &&
        matchesDestination
      );
    });
  }, [
    rows,
    query,
    statusFilter,
    date,
    bulkSearchQuery,
    selectedStatuses,
    dateFrom,
    dateTo,
    originFilter,
    destinationFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    query,
    statusFilter,
    date,
    bulkSearchQuery,
    selectedStatuses,
    dateFrom,
    dateTo,
    originFilter,
    destinationFilter,
  ]);

  // Handler functions for new features
  function handleBulkSearch() {
    setBulkSearchOpen(true);
  }

  function handleApplyBulkSearch() {
    setQuery(""); // Clear regular search when using bulk search
    setBulkSearchOpen(false);
  }

  function handleClearBulkSearch() {
    setBulkSearchQuery("");
    setBulkSearchOpen(false);
  }

  function handleAdvancedFilters() {
    setAdvancedFiltersOpen(true);
  }

  function handleApplyAdvancedFilters() {
    setAdvancedFiltersOpen(false);
  }

  function handleClearAdvancedFilters() {
    setDateFrom("");
    setDateTo("");
    setSelectedStatuses([]);
    setOriginFilter("");
    setDestinationFilter("");
    setAdvancedFiltersOpen(false);
  }

  function toggleStatus(status: string) {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  }

  const totalCount = rows.length;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const clampedPage = Math.min(currentPage, totalPages);
  const start = (clampedPage - 1) * pageSize;
  const end = start + pageSize;
  const pageRows = filteredRows.slice(start, end);

  const [viewOpen, setViewOpen] = useState(false);
  type ViewData = {
    reference?: string;
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    status?: string;
    codAmount?: number;
    deliveryFee?: number;
    createdAt?: string | Date;
  } | null;
  const [viewData, setViewData] = useState<ViewData>(null);

  async function handleView(deliveryId: string) {
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}`);
      if (!res.ok) return;
      const d = await res.json();
      setViewData(d.delivery);
      setViewOpen(true);
    } catch {}
  }

  async function handleDelete(deliveryId: string) {
    const ok = confirm("Delete this delivery?");
    if (!ok) return;
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.deliveryId !== deliveryId));
      }
    } catch {}
  }

  function handleEdit(deliveryId: string) {
    window.location.href = `/client/delivery/${deliveryId}`;
  }

  function exportCsv() {
    const headers = [
      "Tracking ID",
      "Customer",
      "Email",
      "Status",
      "Origin",
      "Destination",
      "Date",
    ];
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [headers.join(",")].concat(
      filteredRows.map((r) =>
        [
          r.trackingId,
          r.customerName,
          r.customerEmail,
          r.status,
          r.origin,
          r.destination,
          r.date,
        ]
          .map(escape)
          .join(",")
      )
    );
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const today = new Date().toISOString().slice(0, 10);
    a.download = `deliveries_${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(260px,1fr)_200px_200px_auto] md:items-center">
          <Input
            leftIcon={<SearchIcon size={16} />}
            placeholder="Search by tracking ID, customer name, email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter((e.target as HTMLSelectElement).value)
            }
          >
            <option value="">All Statuses</option>
            <option value="delivered">Delivered</option>
            <option value="in_transit">In Transit</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="returned">Returned</option>
          </Select>
          <Input
            type="date"
            placeholder="mm/dd/yyyy"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="flex gap-2 md:justify-end">
            <Button leftIcon={<SearchIcon size={16} />}>Search</Button>
            <Button
              variant="secondary"
              leftIcon={<ListIcon size={16} />}
              onClick={handleBulkSearch}
            >
              Bulk Search
            </Button>
            <Button
              variant="secondary"
              leftIcon={<FilterIcon size={16} />}
              onClick={handleAdvancedFilters}
            >
              Advanced Filters
            </Button>
            <Button
              variant="gradient"
              leftIcon={<UploadIcon size={16} />}
              onClick={exportCsv}
            >
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padded={false}>
        <div className="flex items-center justify-between px-6 py-4 rounded-t-xl bg-[linear-gradient(90deg,#0EA5E9_0%,#0284c7_100%)] text-white">
          <div className="font-semibold">All Deliveries</div>
          <div className="text-[12px] bg-white/15 px-3 py-1 rounded-full">
            {totalCount.toLocaleString()} total deliveries
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-[13px] text-slate-500">
                {[
                  "",
                  "Tracking ID",
                  "Customer",
                  "Status",
                  "Origin",
                  "Destination",
                  "Date",
                  "Actions",
                ].map((h, idx) => (
                  <th key={h + idx} className="px-6 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.trackingId} className="border-t border-slate-100">
                  <td className="px-6 py-3 align-middle">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </td>
                  <td className="px-6 py-3 align-middle">
                    <div className="text-[#0EA5E9] font-medium hover:underline cursor-pointer">
                      {r.trackingId.split(" ")[0]}
                      <div className="text-xs text-[#0EA5E9]/80">
                        {r.trackingId.split(" ")[1]}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 align-middle">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-full grid place-items-center text-white text-[12px] font-semibold"
                        style={{
                          backgroundColor: `hsl(${r.avatarHue} 80% 45%)`,
                        }}
                        aria-hidden
                      >
                        {r.customerName
                          .split(" ")
                          .map((s) => s[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[14px] font-medium text-slate-800">
                          {r.customerName}
                        </div>
                        <div className="text-[12px] text-slate-500">
                          {r.customerEmail}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 align-middle">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-6 py-3 align-middle text-slate-700">
                    {r.origin}
                  </td>
                  <td className="px-6 py-3 align-middle text-slate-700">
                    {r.destination}
                  </td>
                  <td className="px-6 py-3 align-middle text-slate-700">
                    {new Date(r.date).toLocaleString(undefined, {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-3 align-middle text-[#0EA5E9]">
                    <div className="flex items-center gap-3">
                      <IconButton
                        label="View"
                        onClick={() => handleView(r.deliveryId)}
                      >
                        <EyeIcon size={16} />
                      </IconButton>
                      <IconButton
                        label="Edit"
                        onClick={() => handleEdit(r.deliveryId)}
                      >
                        <EditIcon size={16} />
                      </IconButton>
                      <IconButton
                        label="Delete"
                        onClick={() => handleDelete(r.deliveryId)}
                      >
                        <TrashIcon size={16} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && rows.length === 0 && (
            <div className="p-6 text-sm text-slate-500">
              No deliveries found.
            </div>
          )}
          {loading && (
            <div className="p-6 text-sm text-slate-500">Loading…</div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <div className="text-[12px] text-slate-500">
            Showing {filteredRows.length === 0 ? 0 : start + 1} to{" "}
            {Math.min(end, filteredRows.length)} of {filteredRows.length}{" "}
            results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, clampedPage - 1))}
              disabled={clampedPage === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  className={
                    "h-9 w-9 rounded-md text-sm font-medium " +
                    (p === clampedPage
                      ? "bg-[#0EA5E9] text-white"
                      : "border border-slate-200")
                  }
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              );
            })}
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, clampedPage + 1))
              }
              disabled={clampedPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Delivery Details"
      >
        {viewData ? (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-slate-500">Reference:</span>{" "}
              <span className="font-medium">{viewData.reference}</span>
            </div>
            <div>
              <span className="text-slate-500">Customer:</span>{" "}
              <span className="font-medium">{viewData.customerName}</span>
            </div>
            <div>
              <span className="text-slate-500">Phone:</span>{" "}
              <span className="font-medium">{viewData.customerPhone}</span>
            </div>
            <div>
              <span className="text-slate-500">Address:</span>{" "}
              <span className="font-medium">{viewData.deliveryAddress}</span>
            </div>
            <div>
              <span className="text-slate-500">Status:</span>{" "}
              <span className="font-medium">{viewData.status}</span>
            </div>
            <div>
              <span className="text-slate-500">COD Amount:</span>{" "}
              <span className="font-medium">
                ₹{Number(viewData.codAmount || 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Delivery Fee:</span>{" "}
              <span className="font-medium">
                ₹{Number(viewData.deliveryFee || 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Created:</span>{" "}
              <span className="font-medium">
                {new Date(viewData.createdAt ?? Date.now()).toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Loading…</div>
        )}
      </Modal>

      {/* Bulk Search Modal */}
      <Modal
        open={bulkSearchOpen}
        onClose={() => setBulkSearchOpen(false)}
        title="Bulk Search Tracking IDs"
        widthClassName="max-w-2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Enter tracking IDs (one per line or comma/space separated)
            </label>
            <textarea
              className="w-full h-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9]"
              placeholder="SH-001&#10;SH-002&#10;SH-003&#10;&#10;Or: SH-001, SH-002, SH-003"
              value={bulkSearchQuery}
              onChange={(e) => setBulkSearchQuery(e.target.value)}
            />
            <div className="mt-2 text-xs text-slate-500">
              {
                bulkSearchQuery
                  .split(/[\n,\s]+/)
                  .filter((id) => id.trim().length > 0).length
              }{" "}
              tracking IDs detected
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClearBulkSearch}>
              Clear & Close
            </Button>
            <Button onClick={handleApplyBulkSearch}>Apply Search</Button>
          </div>
        </div>
      </Modal>

      {/* Advanced Filters Modal */}
      <Modal
        open={advancedFiltersOpen}
        onClose={() => setAdvancedFiltersOpen(false)}
        title="Advanced Filters"
        widthClassName="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <CalendarIcon size={16} className="inline mr-1" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  From
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Multiple Status Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status (multiple selection)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "delivered", label: "Delivered" },
                { value: "in_transit", label: "In Transit" },
                { value: "pending", label: "Pending" },
                { value: "assigned", label: "Assigned" },
                { value: "returned", label: "Returned" },
              ].map((status) => (
                <label
                  key={status.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status.value)}
                    onChange={() => toggleStatus(status.value)}
                    className="h-4 w-4 rounded border-slate-300 text-[#0EA5E9] focus:ring-[#0EA5E9]"
                  />
                  <span className="text-sm text-slate-700">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Location Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Origin Filter
              </label>
              <Input
                placeholder="Filter by origin address..."
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Destination Filter
              </label>
              <Input
                placeholder="Filter by destination address..."
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button variant="secondary" onClick={handleClearAdvancedFilters}>
              Clear All
            </Button>
            <Button onClick={handleApplyAdvancedFilters}>Apply Filters</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatusBadge({ status }: { status: DeliveryRow["status"] }) {
  const mapping: Record<
    DeliveryRow["status"],
    { label: string; variant: Parameters<typeof Badge>[0]["variant"] }
  > = {
    Delivered: { label: "Delivered", variant: "success" },
    "In Transit": { label: "In Transit", variant: "info" },
    Pending: { label: "Pending", variant: "warning" },
    Returned: { label: "Returned", variant: "danger" },
    Assigned: { label: "Assigned", variant: "default" },
  } as const;
  const { label, variant } = mapping[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      className="h-8 w-8 inline-grid place-items-center rounded-md text-[#0EA5E9] hover:bg-sky-50"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
