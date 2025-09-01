"use client";

import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  PlusIcon,
  SearchIcon,
  TruckIcon,
  CheckIcon,
  RefreshIcon,
  ClockIcon,
  DownloadIcon,
  ArrowUpIcon,
} from "@/components/icons";
import DeliveryChart from "@/components/ui/DeliveryChart";
import Select from "@/components/ui/Select";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type StatCard = {
  label: string;
  value: number;
  change: string;
  trending: "up" | "down";
  icon: (props: { size?: number; className?: string }) => React.ReactElement;
  color: "blue" | "green" | "red" | "yellow";
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<{
    activeDeliveries: number;
    delivered: number;
    returned: number;
  } | null>(null);
  const [recent, setRecent] = useState<
    {
      _id: string;
      reference?: string;
      customerName: string;
      status: string;
      createdAt: string;
      assignedDriverId: { _id?: string; firstName?: string; lastName?: string };
    }[]
  >([]);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed" | "pending"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
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
    assignedDriverId?: { firstName?: string; lastName?: string };
    notes?: string;
  };
  const [viewDelivery, setViewDelivery] = useState<DeliveryDetail | null>(null);

  // Bulk update state
  const [bulkStatusFilter, setBulkStatusFilter] = useState<string>("pending");
  const [bulkIds, setBulkIds] = useState<string>("");

  // Bulk search state
  const [bulkSearchIds, setBulkSearchIds] = useState<string>("");
  const [bulkSearchResults, setBulkSearchResults] = useState<
    Array<{
      id: string;
      reference: string;
      customerName: string;
      customerPhone: string;
      deliveryAddress: string;
      paymentMethod: string;
      codAmount: number;
      priority: string;
      status: string;
      assignedDriver: string;
      assignedCourier: string;
      createdBy: string;
      notes: string;
      createdAt: string;
      updatedAt: string;
    }>
  >([]);
  const [bulkSearchLoading, setBulkSearchLoading] = useState(false);

  // Selection and assignment state
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

  // Chart state
  const [chartPeriod, setChartPeriod] = useState<string>("7");

  // Activity log state
  const [activityLog, setActivityLog] = useState<
    Array<{
      action: string;
      performedBy: {
        firstName: string;
        lastName: string;
        role: string;
      };
      performedAt: Date;
      details?: string;
      oldValue?: string;
      newValue?: string;
    }>
  >([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "activity">("details");

  useEffect(() => {
    let mounted = true;
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        if (mounted) setStats(d);
      })
      .catch(() => {})
      .finally(() => {});
    fetch("/api/deliveries")
      .then((r) => r.json())
      .then((d) => {
        if (mounted) setRecent((d.deliveries || []).slice(0, 4));
      })
      .catch(() => {});

    // Load active drivers/couriers for dropdown
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
  }, [refreshKey]);

  const statCards: StatCard[] = useMemo(
    () => [
      {
        label: "Active Deliveries",
        value: stats?.activeDeliveries ?? 0,
        change: "",
        trending: "up",
        icon: TruckIcon,
        color: "blue",
      },
      {
        label: "Completed",
        value: stats?.delivered ?? 0,
        change: "",
        trending: "up",
        icon: CheckIcon,
        color: "green",
      },
      {
        label: "Returned",
        value: stats?.returned ?? 0,
        change: "",
        trending: "down",
        icon: RefreshIcon,
        color: "red",
      },
      {
        label: "Pending Upload",
        value: 0,
        change: "",
        trending: "up",
        icon: ClockIcon,
        color: "yellow",
      },
    ],
    [stats]
  );

  const filteredRecent = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const isActive = (s: string) => s === "in_transit";
    const isCompleted = (s: string) => s === "delivered";
    const isPending = (s: string) => s === "pending";
    let rows = recent;
    if (statusFilter === "active")
      rows = rows.filter((r) => isActive(r.status));
    if (statusFilter === "completed")
      rows = rows.filter((r) => isCompleted(r.status));
    if (statusFilter === "pending")
      rows = rows.filter((r) => isPending(r.status));
    if (query) {
      rows = rows.filter(
        (r) =>
          r.reference?.toLowerCase().includes(query) ||
          r.customerName.toLowerCase().includes(query) ||
          String(r._id).toLowerCase().includes(query)
      );
    }
    return rows;
  }, [recent, statusFilter, searchQuery]);
  const COD_DRIVER_ID = "68b4e8320937d8c4337027a6";

  // Selection helper functions
  const allVisibleSelected = useMemo(
    () =>
      filteredRecent.length > 0 &&
      filteredRecent.every((d) => selectedIds.has(d._id)),
    [filteredRecent, selectedIds]
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
      const ids = filteredRecent.map((d) => d._id);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
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

      showSuccess(
        "Assignment Successful",
        `Successfully assigned ${data.updatedCount} parcel${
          data.updatedCount > 1 ? "s" : ""
        } to ${data.courierName}`
      );

      setSelectedIds(new Set());
      setSelectedCourierId("");

      // Refresh data
      setRefreshKey((k) => k + 1);
    } catch {
      showError("Assignment Failed", "Failed to assign parcels to courier");
    }
  }

  async function handleBulkSearch() {
    if (!bulkSearchIds.trim()) {
      showError("Search Failed", "Please enter at least one reference ID");
      return;
    }

    setBulkSearchLoading(true);
    try {
      const ids = bulkSearchIds
        .split(/[\n,\s]+/)
        .map((id) => id.trim())
        .filter(Boolean);

      if (ids.length === 0) {
        showError("Search Failed", "No valid reference IDs provided");
        return;
      }

      const res = await fetch("/api/deliveries/bulk-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, format: "json" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError("Search Failed", data?.error ?? "Failed to search parcels");
        return;
      }

      setBulkSearchResults(data.deliveries || []);
      showSuccess(
        "Search Successful",
        `Found ${data.count} parcel${data.count > 1 ? "s" : ""}`
      );
    } catch {
      showError("Search Failed", "Failed to search parcels");
    } finally {
      setBulkSearchLoading(false);
    }
  }

  async function handleDownload(format: "csv" | "xls") {
    if (!bulkSearchIds.trim()) {
      showError("Download Failed", "Please enter at least one reference ID");
      return;
    }

    try {
      const ids = bulkSearchIds
        .split(/[\n,\s]+/)
        .map((id) => id.trim())
        .filter(Boolean);

      if (ids.length === 0) {
        showError("Download Failed", "No valid reference IDs provided");
        return;
      }

      const res = await fetch("/api/deliveries/bulk-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, format }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError("Download Failed", data?.error ?? "Failed to download file");
        return;
      }

      // Create blob and download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bulk-search-${
        new Date().toISOString().split("T")[0]
      }.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showSuccess("Download Successful", `File downloaded successfully`);
    } catch {
      showError("Download Failed", "Failed to download file");
    }
  }

  function openViewDelivery(id: string) {
    setViewOpen(true);
    setViewLoading(true);
    setViewDelivery(null);
    setActiveTab("details");
    setActivityLog([]);

    // Fetch delivery details
    fetch(`/api/deliveries/${id}`)
      .then((r) => r.json())
      .then((d) => setViewDelivery((d.delivery as DeliveryDetail) ?? null))
      .finally(() => setViewLoading(false));

    // Fetch activity log
    setLoadingActivity(true);
    fetch(`/api/deliveries/${id}/activity`)
      .then((r) => r.json())
      .then((d) => setActivityLog(d.activityLog || []))
      .catch(() => setActivityLog([]))
      .finally(() => setLoadingActivity(false));
  }
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end md:justify-between">
        <div className="md:block hidden">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-slate-600 text-base mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your deliveries
            today.
          </p>
        </div>
        <Button
          onClick={() => {
            router.push("/admin/deliveries/new");
          }}
          className="cursor-pointer"
          variant="gradient"
          leftIcon={<PlusIcon size={20} />}
          size="lg"
        >
          New Delivery
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const IconComponent = stat.icon;
          const colorClasses = {
            blue: "bg-blue-50 text-blue-600",
            green: "bg-emerald-50 text-emerald-600",
            red: "bg-red-50 text-red-600",
            yellow: "bg-amber-50 text-amber-600",
          };

          return (
            <Card
              key={stat.label}
              className="rounded-2xl border border-slate-200/60 bg-white shadow-card hover:shadow-hover transition-all duration-200 group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm text-slate-600 font-medium">
                    {stat.label}
                  </div>
                  <div className="mt-2 text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {stat.value.toLocaleString()}
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <ArrowUpIcon
                      size={16}
                      className={
                        stat.trending === "up"
                          ? "text-emerald-600"
                          : "text-red-600 rotate-180"
                      }
                    />
                    <span
                      className={`text-sm font-medium ${
                        stat.trending === "up"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-sm text-slate-500">
                      vs last month
                    </span>
                  </div>
                </div>
                <div
                  className={`h-12 w-12 rounded-xl ${
                    colorClasses[stat.color as keyof typeof colorClasses]
                  } flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                >
                  <IconComponent size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card header={<div className="font-semibold">Bulk Status Update</div>}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr_auto]">
          <Select
            value={bulkStatusFilter}
            onChange={(e) =>
              setBulkStatusFilter((e.target as HTMLSelectElement).value)
            }
          >
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="assigned">Assigned</option>
            <option value="returned">Returned</option>
            <option value="future_delivery">Future Delivery</option>
            <option value="lost_damaged">Lost & Damages</option>
          </Select>
          <Input
            placeholder="Reference ID1, Reference ID2, Reference ID3..."
            value={bulkIds}
            onChange={(e) => setBulkIds((e.target as HTMLInputElement).value)}
          />
          <Button
            onClick={async () => {
              const newStatus = bulkStatusFilter || "in_transit";
              if (!bulkIds) return;
              const ids = bulkIds
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
              if (ids.length === 0) return;
              const res = await fetch("/api/deliveries/bulk-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids, status: newStatus }),
              });
              if (res.ok) {
                // refresh data
                setRefreshKey((k) => k + 1);
                showSuccess(
                  "Status Updated",
                  "Delivery status has been updated successfully"
                );
                setBulkIds("");
              } else {
                const data = await res.json().catch(() => ({}));
                showError("Update Failed", data?.error ?? "Failed to update");
              }
            }}
          >
            Update Selected
          </Button>
        </div>
      </Card>

      <Card
        header={<div className="font-semibold">Bulk Search & Download</div>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_auto_auto]">
            <Input
              placeholder="Reference ID1, Reference ID2, Reference ID3... (separate with commas, spaces, or new lines)"
              value={bulkSearchIds}
              onChange={(e) =>
                setBulkSearchIds((e.target as HTMLInputElement).value)
              }
            />
            <Button
              onClick={handleBulkSearch}
              loading={bulkSearchLoading}
              variant="secondary"
            >
              Search
            </Button>
            <Button
              onClick={() => handleDownload("csv")}
              variant="secondary"
              disabled={!bulkSearchIds.trim()}
              leftIcon={<DownloadIcon size={16} />}
            >
              Download CSV
            </Button>
            <Button
              onClick={() => handleDownload("xls")}
              variant="secondary"
              disabled={!bulkSearchIds.trim()}
              leftIcon={<DownloadIcon size={16} />}
            >
              Download XLS
            </Button>
          </div>

          {/* Search Results */}
          {bulkSearchResults.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-slate-900">
                  Search Results ({bulkSearchResults.length} parcels found)
                </h4>
                <button
                  onClick={() => setBulkSearchResults([])}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Clear Results
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-slate-200 rounded-lg">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">
                        Reference
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">
                        Customer
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">
                        Payment
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">
                        COD Amount
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">
                        Assigned To
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {bulkSearchResults.map((delivery, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-sm font-medium text-slate-900">
                          {delivery.reference ||
                            delivery.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-700">
                          {delivery.customerName}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold capitalize ${
                              delivery.status === "delivered"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                : delivery.status === "in_transit"
                                ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                                : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                            }`}
                          >
                            {delivery.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-700">
                          {delivery.paymentMethod}
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-700">
                          {delivery.codAmount
                            ? `SAR ${Number(delivery.codAmount).toFixed(2)}`
                            : "—"}
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-700">
                          {delivery.assignedDriver ||
                            delivery.assignedCourier ||
                            "Not assigned"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2 rounded-2xl border border-slate-200/60 shadow-card"
          header={
            <div className="flex items-center justify-between w-full">
              <h3 className="font-semibold text-lg text-slate-900">
                Deliveries Overview
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={chartPeriod}
                  onChange={(e) => setChartPeriod(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                </select>
              </div>
            </div>
          }
        >
          <DeliveryChart period={chartPeriod} />
        </Card>

        <Card
          className="rounded-2xl border border-slate-200/60 shadow-card"
          header={
            <div className="flex items-center justify-between w-full">
              <h3 className="font-semibold text-lg text-slate-900">
                Recent Activity
              </h3>
              <button
                onClick={() => {
                  router.push("/admin/deliveries");
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {recent.map((delivery, idx) => {
              const colorClasses = {
                blue: "bg-blue-50 text-blue-600",
                green: "bg-emerald-50 text-emerald-600",
                red: "bg-red-50 text-red-600",
              };

              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`h-8 w-8 rounded-lg ${
                      colorClasses[
                        (delivery.status === "delivered"
                          ? "green"
                          : delivery.status === "returned"
                          ? "red"
                          : "blue") as keyof typeof colorClasses
                      ]
                    } flex items-center justify-center flex-shrink-0`}
                  >
                    {delivery.status === "delivered" ? (
                      <CheckIcon size={16} />
                    ) : delivery.status === "returned" ? (
                      <RefreshIcon size={16} />
                    ) : (
                      <TruckIcon size={16} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {`${
                        delivery.assignedDriverId?._id === COD_DRIVER_ID
                          ? "External"
                          : "Internal"
                      } delivery created { ${
                        delivery.reference ||
                        delivery._id.slice(-8).toUpperCase()
                      } }`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(delivery.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card
        className="rounded-2xl border border-slate-200/60 shadow-card"
        header={
          <div className="flex items-center justify-between w-full">
            <h3 className="font-semibold text-lg text-slate-900">
              Recent Deliveries
            </h3>
            <button
              onClick={() => {
                router.push("/admin/deliveries");
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all deliveries
            </button>
          </div>
        }
        padded={false}
      >
        <div className="px-6 pb-4 flex items-center gap-3">
          <div className="flex items-center gap-2 ">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === "all"
                  ? "text-blue-600 bg-blue-50"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === "active"
                  ? "text-blue-600 bg-blue-50"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === "completed"
                  ? "text-blue-600 bg-blue-50"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === "pending"
                  ? "text-blue-600 bg-blue-50"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Pending
            </button>
          </div>
          <div className="ml-auto w-80 mt-2">
            <Input
              leftIcon={<SearchIcon size={16} />}
              placeholder="Search deliveries..."
              className="border-slate-200"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery((e.target as HTMLInputElement).value)
              }
            />
          </div>
        </div>

        {/* Courier Assignment Section */}
        {selectedIds.size > 0 && (
          <div className="px-6 pb-4 border-t border-slate-100">
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
            <thead className="bg-slate-50/50">
              <tr className="text-left text-slate-600 text-sm">
                <th className="px-6 py-4 font-semibold first:rounded-tl-xl">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    aria-label="Select all visible"
                  />
                </th>
                {[
                  "Reference ID",
                  "Client",
                  "Status",
                  "Date",
                  "Driver",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 font-semibold last:rounded-tr-xl"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecent.map((delivery) => (
                <tr
                  key={delivery._id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(delivery._id)}
                      onChange={() => toggleSelectOne(delivery._id)}
                      aria-label={`Select ${delivery._id}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900 uppercase">
                      {delivery.reference}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                        {delivery.reference?.slice(-2).toUpperCase() ||
                          delivery._id.slice(-2).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900">
                        {`${
                          delivery.assignedDriverId?._id === COD_DRIVER_ID
                            ? "External"
                            : "Internal"
                        } delivery created { ${
                          delivery.reference ||
                          delivery._id.slice(-8).toUpperCase()
                        } }`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        delivery.status === "delivered"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : delivery.status === "in_transit"
                          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                      }`}
                    >
                      {delivery.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(delivery.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={"text-slate-400 italic"}>
                      {delivery.assignedDriverId?.firstName || "Not assigned"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openViewDelivery(delivery._id)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                    >
                      View Details
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
        widthClassName="max-w-4xl"
      >
        {viewLoading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : viewDelivery ? (
          <div>
            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-4">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "details"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                BRIEF
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "activity"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                HISTORY
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "details" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-[12px] text-slate-500">Order ID</div>
                    <div className="font-medium">
                      {String(viewDelivery._id)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] text-slate-500">Reference</div>
                    <div className="font-medium uppercase ">
                      {viewDelivery.reference || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] text-slate-500">Customer</div>
                    <div className="font-medium">
                      {viewDelivery.customerName}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] text-slate-500">Phone</div>
                    <div className="font-medium">
                      {viewDelivery.customerPhone}
                    </div>
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
                    <div className="font-medium">
                      {viewDelivery.paymentMethod}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] text-slate-500">COD Amount</div>
                    <div className="font-medium">
                      {viewDelivery.codAmount
                        ? `SAR ${Number(viewDelivery.codAmount).toFixed(2)}`
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
                    <div className="font-medium capitalize text-slate-900">
                      {viewDelivery.status.replace("_", " ")}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-[12px] text-slate-500">
                      Assigned Driver
                    </div>
                    <div className="font-medium">
                      {viewDelivery.assignedDriverId?.firstName || "—"}{" "}
                      {viewDelivery.assignedDriverId?.lastName || "—"}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-[12px] text-slate-500">Notes</div>
                    <div className="font-medium">
                      {viewDelivery.notes || "—"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-slate-900">
                    Activity Log
                  </h3>
                </div>

                {loadingActivity ? (
                  <div className="text-center py-8 text-slate-500">
                    Loading activity log...
                  </div>
                ) : activityLog.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No activity recorded yet
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-600"></div>

                    {/* Activity items */}
                    <div className="space-y-4">
                      {activityLog.map((activity, index) => (
                        <div
                          key={index}
                          className="relative flex items-start gap-4"
                        >
                          {/* Timeline dot */}
                          <div
                            className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              activity.action === "note_added"
                                ? "bg-amber-500"
                                : "bg-blue-600"
                            }`}
                          >
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>

                          {/* Activity content */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-900">
                              <span className="capitalize">
                                {activity.action.replace(/_/g, " ")}
                              </span>
                              {activity.details && (
                                <span className="text-slate-600">
                                  : {activity.details}
                                </span>
                              )}
                            </div>

                            {/* User info */}
                            <div className="mt-1 text-xs text-slate-500">
                              by{" "}
                              <span className="text-amber-700 font-medium">
                                {activity.performedBy.firstName}{" "}
                                {activity.performedBy.lastName}
                              </span>
                              {activity.performedBy.role && (
                                <span className="text-slate-400">
                                  {" "}
                                  (Role: {activity.performedBy.role})
                                </span>
                              )}
                            </div>

                            {/* Timestamp */}
                            <div className="mt-1 text-xs text-slate-400">
                              {new Date(activity.performedAt).toLocaleString()}
                            </div>

                            {/* Value changes if applicable */}
                            {activity.oldValue && activity.newValue && (
                              <div className="mt-2 p-2 bg-slate-50 rounded text-xs">
                                <div className="text-slate-600">
                                  <span className="font-medium">
                                    Changed from:
                                  </span>{" "}
                                  {activity.oldValue}
                                </div>
                                <div className="text-sm text-slate-600">
                                  <span className="font-medium">
                                    Changed to:
                                  </span>{" "}
                                  {activity.newValue}
                                </div>
                              </div>
                            )}

                            {/* Special display for notes */}
                            {activity.action === "note_added" && (
                              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                <div className="text-sm text-amber-800 font-medium mb-1">
                                  📝 Note
                                </div>
                                <div className="text-sm text-amber-700">
                                  {activity.details?.replace(
                                    "Note added: ",
                                    ""
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-slate-500">Delivery not found</div>
        )}
      </Modal>
    </div>
  );
}
