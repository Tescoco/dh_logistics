"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import {
  SearchIcon,
  UploadIcon,
  EyeIcon,
  EditIcon,
  FilterIcon,
  ListIcon,
  CalendarIcon,
} from "@/components/icons";

type DeliveryRow = {
  deliveryId: string;
  trackingId: string;
  customerName: string;
  customerPhone: string;
  reference: string;
  status:
    | "Delivered"
    | "In Transit"
    | "Pending"
    | "Returned"
    | "Assigned"
    | "Cancelled"
    | "Future Delivery"
    | "RTO"
    | "Lost & Damages"
    | "Returning"
    | "Record Created"
    | "Attempted Cancel"
    | "No Answer"
    | "Number Switched Off"
    | "Shipment on Hold"
    | "Out for Delivery";
  origin: string;
  destination: string;
  date: string; // ISO string
  avatarHue: number; // HSL hue to generate a simple avatar color
  clientStoreName?: string; // Client's store name
  codAmount?: number; // COD amount
};

type DeliveryApiLite = {
  _id?: string;
  reference?: string;
  customerName?: string;
  customerPhone?: string;
  status?:
    | "delivered"
    | "in_transit"
    | "pending"
    | "assigned"
    | "returned"
    | "cancelled"
    | "future_delivery"
    | "rto"
    | "lost_damaged"
    | "returning"
    | "record_created"
    | "attempted_cancel"
    | "no_answer"
    | "number_switched_off"
    | "shipment_on_hold"
    | "out_for_delivery";
  senderAddress?: string;
  senderName?: string;
  senderPhone?: string;
  senderCity?: string;
  senderDistrict?: string;
  senderPostalCode?: string;
  deliveryAddress?: string;
  createdAt?: string | Date;
  clientStoreName?: string; // Added for client store name
  codAmount?: number; // Added for COD amount
};

export default function TrackDeliveriesPage() {
  const router = useRouter();
  const { showError } = useToast();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [rows, setRows] = useState<DeliveryRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Ticket generation state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTicketType, setSelectedTicketType] = useState<string>("");
  const [generatingTickets, setGeneratingTickets] = useState(false);

  // Statistics state
  const [stats, setStats] = useState({
    totalParcels: 0,
    delivered: 0,
    inTransit: 0,
    pending: 0,
    assigned: 0,
    outForDelivery: 0,
    deliveryRatio: 0,
  });

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

  // Fetch statistics from API
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        const deliveryRatio =
          data.totalParcels > 0
            ? Math.round((data.delivered / data.totalParcels) * 100)
            : 0;

        setStats({
          totalParcels: data.totalParcels || 0,
          delivered: data.delivered || 0,
          inTransit: data.inTransit || 0,
          pending: data.pending || 0,
          assigned: data.assigned || 0,
          outForDelivery: data.outForDelivery || 0,
          deliveryRatio,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    setLoading(true);
    const url = new URL("/api/deliveries", window.location.origin);
    if (statusFilter) url.searchParams.set("status", statusFilter);

    Promise.all([fetch(url.toString()).then((r) => r.json()), fetchStats()])
      .then(([d]) => {
        const serverRows: DeliveryRow[] = (
          (d.deliveries || []) as DeliveryApiLite[]
        )
          .slice(0, 100)
          .map((it: DeliveryApiLite, i: number) => ({
            deliveryId: String(it._id || ""),
            trackingId: it.reference || `SH-${String(i).padStart(3, "0")}`,
            customerName: it.customerName || "—",
            customerPhone: it.customerPhone || "—",
            reference: it.reference || "—",
            status:
              it.status === "record_created"
                ? "Record Created"
                : it.status === "delivered"
                ? "Delivered"
                : it.status === "in_transit"
                ? "In Transit"
                : it.status === "pending"
                ? "Pending"
                : it.status === "assigned"
                ? "Assigned"
                : it.status === "returned"
                ? "Returned"
                : it.status === "cancelled"
                ? "Cancelled"
                : it.status === "future_delivery"
                ? "Future Delivery"
                : it.status === "rto"
                ? "RTO"
                : it.status === "lost_damaged"
                ? "Lost & Damages"
                : it.status === "returning"
                ? "Returning"
                : it.status === "attempted_cancel"
                ? "Attempted Cancel"
                : it.status === "no_answer"
                ? "No Answer"
                : it.status === "number_switched_off"
                ? "Number Switched Off"
                : it.status === "shipment_on_hold"
                ? "Shipment on Hold"
                : it.status === "out_for_delivery"
                ? "Out for Delivery"
                : "Pending",
            origin: it.senderAddress || "—",
            destination: it.deliveryAddress || "—",
            date: new Date(it.createdAt ?? Date.now())
              .toISOString()
              .slice(0, 10),
            avatarHue: (i * 47) % 360,
            clientStoreName: it.clientStoreName || "—",
            codAmount: it.codAmount || 0,
          }));
        setRows(serverRows);
      })
      .catch(() => {
        setRows([]);
      })
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
            r.reference,
            r.customerPhone,
            r.origin,
            r.destination,
            r.status,
            r.clientStoreName || "",
            (r.codAmount || 0).toString(),
          ].some((v) => v.toLowerCase().includes(q))
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

  // Load stats on component mount
  useEffect(() => {
    fetchStats();
  }, []);

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
    senderName?: string;
    senderPhone?: string;
    senderAddress?: string;
    senderCity?: string;
    senderDistrict?: string;
    senderPostalCode?: string;
    deliveryAddress?: string;
    deliveryCity?: string;
    deliveryDistrict?: string;
    deliveryPostalCode?: string;
    status?: string;
    deliveryDate?: string | Date;
    codAmount?: number;
    deliveryFee?: number;
    createdAt?: string | Date;
    clientStoreName?: string; // Added for client store name
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

  async function handleCancel(deliveryId: string) {
    const ok = confirm("Cancel this delivery? This action cannot be undone.");
    if (!ok) return;
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        // Update the local state to reflect the cancelled status
        setRows((prev) =>
          prev.map((r) =>
            r.deliveryId === deliveryId
              ? { ...r, status: "Cancelled" as const }
              : r
          )
        );
      }
    } catch {}
  }

  function handleEdit(deliveryId: string) {
    window.location.href = `/client/delivery/${deliveryId}`;
  }

  // Selection helper functions
  const allVisibleSelected = useMemo(
    () =>
      filteredRows.length > 0 &&
      filteredRows.every((d) => selectedIds.has(d.deliveryId)),
    [filteredRows, selectedIds]
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
      const ids = filteredRows.map((d) => d.deliveryId);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  async function handleGenerateTickets() {
    if (!selectedTicketType || selectedIds.size === 0) return;

    setGeneratingTickets(true);
    try {
      const deliveryIds = Array.from(selectedIds).join(",");

      // For thermal tickets, redirect to the thermal tickets page
      if (selectedTicketType === "thermal") {
        router.push(`/client/thermal-tickets?deliveryIds=${deliveryIds}`);
        return;
      }

      // For A4 tickets, redirect to the A4 tickets page
      if (selectedTicketType === "a4") {
        router.push(`/client/a4-tickets?deliveryIds=${deliveryIds}`);
        return;
      }

      showError("Ticket Generation Failed", "Unknown ticket type selected");
    } catch {
      showError("Ticket Generation Failed", "Failed to generate tickets");
    } finally {
      setGeneratingTickets(false);
    }
  }

  function exportCsv() {
    const headers = [
      "Tracking ID",
      "Customer",
      "Phone",
      "Store",
      "Status",
      "Origin",
      "Destination",
      "COD Amount",
      "Date",
    ];
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [headers.join(",")].concat(
      filteredRows.map((r) =>
        [
          r.trackingId,
          r.customerName,
          r.customerPhone,
          r.clientStoreName || "",
          r.status,
          r.origin,
          r.destination,
          (r.codAmount || 0).toString(),
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
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalParcels}
            </div>
            <div className="text-sm text-slate-600">Total Parcels</div>
          </div>
        </Card>

        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.inTransit}
            </div>
            <div className="text-sm text-slate-600">In Transit</div>
          </div>
        </Card>

        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {stats.assigned}
            </div>
            <div className="text-sm text-slate-600">Assigned</div>
          </div>
        </Card>

        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.pending}
            </div>
            <div className="text-sm text-slate-600">Pending</div>
          </div>
        </Card>

        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.delivered}
            </div>
            <div className="text-sm text-slate-600">Delivered</div>
          </div>
        </Card>

        <Card className="text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {stats.deliveryRatio}%
            </div>
            <div className="text-sm text-slate-600">Delivery Ratio</div>
          </div>
        </Card>
      </div>

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
            <option value="record_created">Record Created</option>
            <option value="delivered">Delivered</option>
            <option value="in_transit">In Transit</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="returned">Returned</option>
            <option value="cancelled">Cancelled</option>
            <option value="future_delivery">Future Delivery</option>
            <option value="rto">RTO</option>
            <option value="lost_damaged">Lost & Damages</option>
            <option value="returning">Returning</option>
            <option value="attempted_cancel">Attempted Cancel</option>
            <option value="no_answer">No Answer</option>
            <option value="number_switched_off">Number Switched Off</option>
            <option value="shipment_on_hold">Shipment on Hold</option>
            <option value="out_for_delivery">Out for Delivery</option>
          </Select>
          <Input
            type="date"
            placeholder="mm/dd/yyyy"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 md:justify-end">
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-6 py-4 rounded-t-xl bg-[linear-gradient(90deg,#0EA5E9_0%,#0284c7_100%)] text-white">
          <div className="font-semibold">All Deliveries</div>
          <div className="text-[12px] bg-white/15 px-3 py-1 rounded-full w-max">
            {totalCount.toLocaleString()} total deliveries
          </div>
        </div>

        {/* Ticket Generation Section */}
        {selectedIds.size > 0 && (
          <div className="px-6 py-4 border-t border-slate-100">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="text-[13px] text-slate-500 whitespace-nowrap">
                Generate tickets for {selectedIds.size} parcel
                {selectedIds.size > 1 ? "s" : ""}
              </div>
              <Select
                className="w-full md:w-56"
                value={selectedTicketType}
                onChange={(e) =>
                  setSelectedTicketType((e.target as HTMLSelectElement).value)
                }
              >
                <option value="" disabled>
                  Select ticket type
                </option>
                <option value="thermal">Thermal Parcel Ticket</option>
                <option value="a4">A4 Parcel Ticket</option>
              </Select>
              <Button
                disabled={
                  !selectedTicketType ||
                  selectedIds.size === 0 ||
                  generatingTickets
                }
                onClick={handleGenerateTickets}
                className="w-full md:w-auto whitespace-nowrap"
              >
                {generatingTickets ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        )}

        {/* Desktop/tablet table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-[13px] text-slate-500">
                <th className="px-6 py-3 font-medium">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    aria-label="Select all visible"
                  />
                </th>
                {[
                  "Tracking ID",
                  "Customer",
                  "Store",
                  "Status",
                  "Origin",
                  "Destination",
                  "COD Amount",
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
                      checked={selectedIds.has(r.deliveryId)}
                      onChange={() => toggleSelectOne(r.deliveryId)}
                      className="h-4 w-4 rounded border-slate-300"
                      aria-label={`Select ${r.trackingId}`}
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
                          {r.customerPhone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 align-middle text-slate-700">
                    {r.clientStoreName}
                  </td>
                  <td className="px-6 py-3 align-middle capitalize">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-6 py-3 align-middle text-slate-700">
                    {r.origin}
                  </td>
                  <td className="px-6 py-3 align-middle text-slate-700">
                    {r.destination}
                  </td>
                  <td className="px-6 py-3 align-middle text-slate-700">
                    {r.codAmount ? `SAR ${r.codAmount.toLocaleString()}` : "—"}
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
                      {r.status !== "Cancelled" && (
                        <IconButton
                          label="Cancel"
                          onClick={() => handleCancel(r.deliveryId)}
                        >
                          <span className="text-[#0EA5E9] text-lg">✕</span>
                        </IconButton>
                      )}
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

        {/* Mobile cards */}
        <div className="sm:hidden">
          <div className="divide-y border-t border-slate-100">
            {pageRows.map((r) => (
              <div key={r.trackingId} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[#0EA5E9] font-semibold">
                      {r.trackingId.split(" ")[0]}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.trackingId.split(" ")[1]}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-full grid place-items-center text-white text-[12px] font-semibold"
                    style={{ backgroundColor: `hsl(${r.avatarHue} 80% 45%)` }}
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
                      {r.customerPhone}
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">From:</span>{" "}
                  {r.origin}
                </div>
                <div className="text-xs text-slate-500">
                  <span className="font-medium text-slate-600">To:</span>{" "}
                  {r.destination}
                </div>
                <div className="text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Store:</span>{" "}
                  {r.clientStoreName}
                </div>
                <div className="text-xs text-slate-500">
                  <span className="font-medium text-slate-600">
                    COD Amount:
                  </span>{" "}
                  {r.codAmount ? `SAR ${r.codAmount.toLocaleString()}` : "—"}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {new Date(r.date).toLocaleString(undefined, {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </div>

                <div className="mt-3 flex items-center gap-3 text-[#0EA5E9]">
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
                  {r.status !== "Cancelled" && (
                    <IconButton
                      label="Cancel"
                      onClick={() => handleCancel(r.deliveryId)}
                    >
                      <span className="text-[#0EA5E9] text-lg">✕</span>
                    </IconButton>
                  )}
                </div>
              </div>
            ))}
          </div>
          {!loading && rows.length === 0 && (
            <div className="p-4 text-sm text-slate-500">
              No deliveries found.
            </div>
          )}
          {loading && (
            <div className="p-4 text-sm text-slate-500">Loading…</div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-t border-slate-100">
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
            <div className="hidden sm:flex items-center gap-2">
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
            </div>
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
              <span className="text-slate-500">Store:</span>{" "}
              <span className="font-medium">
                {viewData.clientStoreName || "—"}
              </span>
            </div>
            <div className="border-t border-slate-100 pt-2 mt-2">
              <span className="text-slate-500 text-xs uppercase tracking-wide">
                Delivery Information
              </span>
            </div>
            <div>
              <span className="text-slate-500">Address:</span>{" "}
              <span className="font-medium">{viewData.deliveryAddress}</span>
            </div>
            {(viewData.deliveryCity ||
              viewData.deliveryDistrict ||
              viewData.deliveryPostalCode) && (
              <div className="pl-4 space-y-1 border-l-2 border-slate-100">
                {viewData.deliveryCity && (
                  <div>
                    <span className="text-slate-500">City:</span>{" "}
                    <span className="font-medium">{viewData.deliveryCity}</span>
                  </div>
                )}
                {viewData.deliveryDistrict && (
                  <div>
                    <span className="text-slate-500">District:</span>{" "}
                    <span className="font-medium">
                      {viewData.deliveryDistrict}
                    </span>
                  </div>
                )}
                {viewData.deliveryPostalCode && (
                  <div>
                    <span className="text-slate-500">Postal Code:</span>{" "}
                    <span className="font-medium">
                      {viewData.deliveryPostalCode}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div>
              <span className="text-slate-500">Status:</span>{" "}
              <span className="font-medium capitalize">
                {viewData.status?.replace("_", " ")}
              </span>
            </div>
            {viewData.deliveryDate && (
              <div>
                <span className="text-slate-500">Delivery Date:</span>{" "}
                <span className="font-medium">
                  {new Date(viewData.deliveryDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
            <div>
              <span className="text-slate-500">COD Amount:</span>{" "}
              <span className="font-medium">
                SAR {Number(viewData.codAmount || 0).toFixed(2)}
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
                { value: "record_created", label: "Record Created" },
                { value: "delivered", label: "Delivered" },
                { value: "in_transit", label: "In Transit" },
                { value: "pending", label: "Pending" },
                { value: "assigned", label: "Assigned" },
                { value: "returned", label: "Returned" },
                { value: "cancelled", label: "Cancelled" },
                { value: "future_delivery", label: "Future Delivery" },
                { value: "rto", label: "RTO" },
                { value: "lost_damaged", label: "Lost & Damages" },
                { value: "returning", label: "Returning" },
                { value: "attempted_cancel", label: "Attempted Cancel" },
                { value: "no_answer", label: "No Answer" },
                { value: "number_switched_off", label: "Number Switched Off" },
                { value: "shipment_on_hold", label: "Shipment on Hold" },
                { value: "out_for_delivery", label: "Out for Delivery" },
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
    Cancelled: { label: "Cancelled", variant: "danger" },
    "Future Delivery": { label: "Future Delivery", variant: "default" },
    RTO: { label: "RTO", variant: "warning" },
    "Lost & Damages": { label: "Lost & Damages", variant: "danger" },
    Returning: { label: "Returning", variant: "warning" },
    "Record Created": { label: "Record Created", variant: "default" },
    "Attempted Cancel": { label: "Attempted Cancel", variant: "warning" },
    "No Answer": { label: "No Answer", variant: "warning" },
    "Number Switched Off": { label: "Number Switched Off", variant: "warning" },
    "Shipment on Hold": { label: "Shipment on Hold", variant: "default" },
    "Out for Delivery": { label: "Out for Delivery", variant: "info" },
  } as const;
  const { label, variant } = mapping[status];
  return <Badge variant={variant}>{label.replace("_", " ")}</Badge>;
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
