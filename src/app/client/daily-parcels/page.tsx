"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import {
  PackageIcon,
  CheckIcon,
  TruckIcon,
  ClockIcon,
  SearchIcon,
  PlusIcon,
  EyeIcon,
  EditIcon,
} from "@/components/icons";

type ParcelRow = {
  deliveryId: string; // DB _id
  id: string; // REF code
  title: string;
  receiverName: string;
  receiverAddress: string;
  receiverPhone: string;
  amount: number;
  status: "Delivered" | "In Transit" | "Pending" | "Returned" | "Assigned";
  date: string; // yyyy-mm-dd
};

type DeliveryApiLite = {
  _id?: string;
  reference?: string;
  packageType?: string;
  description?: string;
  customerName?: string;
  deliveryAddress?: string;
  customerPhone?: string;
  codAmount?: number;
  deliveryFee?: number;
  status?: "delivered" | "in_transit" | "pending" | "assigned" | "returned";
  createdAt?: string | Date;
};

// All rows are fetched from the database via /api/deliveries

export default function DailyParcelsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountBand, setAmountBand] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<ParcelRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [topStats, setTopStats] = useState({
    total: 0,
    delivered: 0,
    inTransit: 0,
    pending: 0,
  });
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

  useEffect(() => {
    // reflect local search back to URL
    const url = new URL(window.location.href);
    if (search) url.searchParams.set("q", search);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/deliveries").then((r) => r.json()),
      fetch("/api/deliveries/stats").then((r) => r.json()),
    ])
      .then(([d, stats]) => {
        const serverRows: ParcelRow[] = (
          (d.deliveries || []) as DeliveryApiLite[]
        )
          .slice(0, 100)
          .map((it: DeliveryApiLite, i: number) => ({
            deliveryId: String(it._id || ""),
            id: it.reference || `PKG-${i}`,
            title: it.packageType || it.description || "Parcel",
            receiverName: it.customerName || "—",
            receiverAddress: it.deliveryAddress || "—",
            receiverPhone: it.customerPhone || "—",
            amount: Number(it.codAmount || it.deliveryFee || 0),
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
            date: new Date(it.createdAt ?? Date.now())
              .toISOString()
              .slice(0, 10),
          }));
        setRows(serverRows);
        setTopStats({
          total: stats.total ?? 0,
          delivered: stats.deliveredToday ?? 0,
          inTransit: stats.inTransit ?? 0,
          pending: stats.pendingAssignment ?? 0,
        });
      })
      .catch(() => {
        setRows([]);
        setTopStats({ total: 0, delivered: 0, inTransit: 0, pending: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQuery = q
        ? [r.title, r.id, r.receiverName, r.receiverAddress, r.status]
            .filter(Boolean)
            .some((v) => (v || "").toLowerCase().includes(q))
        : true;
      const matchesStatus = status
        ? r.status.toLowerCase().replace(/\s+/g, "_") === status.toLowerCase()
        : true;
      const matchesFrom = dateFrom ? r.date >= dateFrom : true;
      const matchesTo = dateTo ? r.date <= dateTo : true;
      const matchesAmount = amountBand
        ? amountBand === "lt50"
          ? r.amount < 50
          : amountBand === "50to100"
          ? r.amount >= 50 && r.amount <= 100
          : r.amount > 100
        : true;
      return (
        matchesQuery &&
        matchesStatus &&
        matchesFrom &&
        matchesTo &&
        matchesAmount
      );
    });
  }, [rows, search, status, dateFrom, dateTo, amountBand]);

  // Reset to first page when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, dateFrom, dateTo, amountBand, pageSize]);

  const pageSizeNum = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSizeNum));
  const clampedPage = Math.min(currentPage, totalPages);
  const pageStart = (clampedPage - 1) * pageSizeNum;
  const pageEnd = pageStart + pageSizeNum;
  const paginatedRows = filteredRows.slice(pageStart, pageEnd);

  function goToPage(p: number) {
    setCurrentPage(Math.max(1, Math.min(totalPages, p)));
  }

  function renderPageButtons() {
    const buttons: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, clampedPage - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let i = start; i <= end; i += 1) buttons.push(i);
    return buttons;
  }

  async function handleView(deliveryId: string) {
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}`);
      if (!res.ok) return;
      const d = await res.json();
      setViewData(d.delivery);
      setViewOpen(true);
    } catch {}
  }

  function handleEdit(deliveryId: string) {
    router.push(`/client/delivery/${deliveryId}`);
  }

  return (
    <div className="space-y-6">
      {/* Top stats (DB-backed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Parcels",
            value: topStats.total,
            change: "",
            Icon: PackageIcon,
            color: "bg-blue-100 text-blue-600",
          },
          {
            label: "Delivered",
            value: topStats.delivered,
            change: "",
            Icon: CheckIcon,
            color: "bg-emerald-100 text-emerald-600",
          },
          {
            label: "In Transit",
            value: topStats.inTransit,
            change: "",
            Icon: TruckIcon,
            color: "bg-amber-100 text-amber-600",
          },
          {
            label: "Pending",
            value: topStats.pending,
            change: "",
            Icon: ClockIcon,
            color: "bg-rose-100 text-rose-600",
          },
        ].map(({ label, value, change, Icon, color }) => (
          <Card key={label} className="p shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                {change ? (
                  <p className="text-xs text-slate-500 mt-2">{change}</p>
                ) : null}
              </div>
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}
              >
                <Icon size={24} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Advanced Filters */}
      <Card header={<div className="font-semibold">Advanced Filters</div>}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_200px_200px_220px_auto] md:items-end">
          <Select
            value={status}
            onChange={(e) => setStatus(e.currentTarget.value)}
          >
            <option value="">All Status</option>
            <option value="delivered">Delivered</option>
            <option value="in_transit">In Transit</option>
            <option value="pending">Pending</option>
            <option value="returned">Returned</option>
            <option value="assigned">Assigned</option>
          </Select>
          <Input
            type="date"
            placeholder="mm/dd/yyyy"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            type="date"
            placeholder="mm/dd/yyyy"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <Select
            value={amountBand}
            onChange={(e) => setAmountBand(e.currentTarget.value)}
          >
            <option value="">All Amounts</option>
            <option value="lt50">Below ₹50</option>
            <option value="50to100">₹50 - ₹100</option>
            <option value="gt100">Above ₹100</option>
          </Select>
          <div className="flex flex-wrap items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                setStatus("");
                setDateFrom("");
                setDateTo("");
                setAmountBand("");
              }}
              className="text-sm text-[#0EA5E9] hover:underline"
            >
              Clear All
            </button>
            <Button className="md:w-40">Apply Filters</Button>
          </div>
        </div>
      </Card>

      {/* Today's Parcels */}
      <Card padded={false}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-6 pt-4">
          <div className="font-semibold text-slate-900">
            Today&apos;s Parcels
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600">Show:</span>
            <Select
              className="w-20"
              value={pageSize}
              onChange={(e) => setPageSize(e.currentTarget.value)}
            >
              {(["10", "20", "50"] as const).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-6 py-3 rounded-t-xl bg-[linear-gradient(90deg,#0EA5E9_0%,#0284c7_100%)] text-white">
          <div className="font-medium">&nbsp;</div>
          <div />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-[13px] text-slate-500">
                {[
                  "Parcel Details",
                  "Receiver",
                  "Amount",
                  "Status",
                  "Actions",
                ].map((h) => {
                  const hideOnMobile = ["Receiver", "Amount"].includes(h);
                  return (
                    <th
                      key={h}
                      className={[
                        "px-6 py-3 font-medium",
                        hideOnMobile ? "hidden sm:table-cell" : "",
                      ].join(" ")}
                    >
                      {h}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-6 py-4 align-top">
                    <div className="font-semibold text-slate-800">
                      {r.title}
                    </div>
                    <div className="text-xs text-slate-500">REF: {r.id}</div>
                  </td>
                  <td className="px-6 py-4 align-top hidden sm:table-cell">
                    <div className="font-medium text-slate-800">
                      {r.receiverName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.receiverAddress}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.receiverPhone}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top font-semibold text-slate-800 hidden sm:table-cell">
                    ₹{r.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-3 text-[#0EA5E9]">
                      <IconButton label="View">
                        <button onClick={() => handleView(r.deliveryId)}>
                          <EyeIcon size={16} />
                        </button>
                      </IconButton>
                      <IconButton label="Edit">
                        <button onClick={() => handleEdit(r.deliveryId)}>
                          <EditIcon size={16} />
                        </button>
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && rows.length === 0 && (
            <div className="p-6 text-sm text-slate-500">No parcels found.</div>
          )}
          {loading && (
            <div className="p-6 text-sm text-slate-500">Loading…</div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-t border-slate-100">
          <div className="text-[12px] text-slate-500">
            Showing {filteredRows.length === 0 ? 0 : pageStart + 1} to{" "}
            {Math.min(pageEnd, filteredRows.length)} of {filteredRows.length}{" "}
            results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => goToPage(clampedPage - 1)}
              disabled={clampedPage === 1}
            >
              Previous
            </Button>
            <div className="hidden sm:flex items-center gap-2">
              {renderPageButtons().map((p) => (
                <button
                  key={p}
                  className={
                    "h-9 w-9 rounded-md text-sm font-medium " +
                    (p === clampedPage
                      ? "bg-[#0EA5E9] text-white"
                      : "border border-slate-200")
                  }
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => goToPage(clampedPage + 1)}
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
        title="Parcel Details"
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
    </div>
  );
}

function StatusBadge({ status }: { status: ParcelRow["status"] }) {
  const mapping: Record<
    ParcelRow["status"],
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
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-label={label}
      title={label}
      className="h-8 w-8 inline-grid place-items-center rounded-md text-[#0EA5E9] hover:bg-sky-50"
    >
      {children}
    </div>
  );
}
