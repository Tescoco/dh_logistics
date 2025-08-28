"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Tabs from "@/components/ui/Tabs";
import { DownloadIcon, SearchIcon } from "@/components/icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/contexts/ToastContext";

type ReportData = {
  _id: string;
  customerName: string;
  customerStoreName?: string;
  deliveryAddress: string;
  codAmount?: number;
  deliveryFee?: number;
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

type Client = {
  _id: string;
  firstName?: string;
  lastName?: string;
  customerStoreName?: string;
  email: string;
};

type GroupedReport = {
  clientId: string;
  clientName: string;
  storeName?: string;
  totalOrders: number;
  totalAmount: number;
  totalFees: number;
  statusBreakdown: Record<string, number>;
  orders: ReportData[];
};

const tabs = [
  { key: "daily", label: "Daily Reports" },
  { key: "monthly", label: "Monthly Reports" },
];

export default function ReportsPage() {
  const { showError, showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState("daily");

  // Date filters , one month ago
  const [fromDate, setFromDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  // For monthly reports
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );

  const [selectedClient, setSelectedClient] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const [reports, setReports] = useState<ReportData[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  // Summary stats
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalAmount: 0,
    totalFees: 0,
    uniqueClients: 0,
  });

  async function loadClients() {
    try {
      const res = await fetch("/api/users/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data.users || []);
      }
    } catch {
      // Ignore error for clients loading
    }
  }

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/deliveries", window.location.origin);

      if (activeTab === "daily") {
        url.searchParams.set("from", fromDate);
        url.searchParams.set("to", toDate);
      } else {
        // Monthly report - first and last day of the month
        const [year, month] = selectedMonth.split("-");
        const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1);
        const lastDay = new Date(parseInt(year), parseInt(month), 0);
        url.searchParams.set("from", firstDay.toISOString().split("T")[0]);
        url.searchParams.set("to", lastDay.toISOString().split("T")[0]);
      }

      if (selectedClient) url.searchParams.set("client", selectedClient);
      if (statusFilter) url.searchParams.set("status", statusFilter);
      url.searchParams.set("detailed", "true");

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setReports(data.deliveries || []);

        // Calculate summary
        const deliveries = data.deliveries || [];
        const totalOrders = deliveries.length;
        const totalAmount = deliveries.reduce(
          (sum: number, d: ReportData) => sum + (d.codAmount || 0),
          0
        );
        const totalFees = deliveries.reduce(
          (sum: number, d: ReportData) => sum + (d.deliveryFee || 0),
          0
        );
        const uniqueClients = new Set(
          deliveries.map((d: ReportData) => d.customerName)
        ).size;

        setSummary({ totalOrders, totalAmount, totalFees, uniqueClients });
      } else {
        showError("Error", "Failed to load reports");
      }
    } catch {
      showError("Error", "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    fromDate,
    toDate,
    selectedMonth,
    selectedClient,
    statusFilter,
    showError,
  ]);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (activeTab === "daily" && fromDate && toDate) {
      loadReports();
    } else if (activeTab === "monthly" && selectedMonth) {
      loadReports();
    }
  }, [
    activeTab,
    fromDate,
    toDate,
    selectedMonth,
    selectedClient,
    statusFilter,
    loadReports,
  ]);

  const groupedReports = useMemo(() => {
    const grouped: Record<string, GroupedReport> = {};

    reports.forEach((report) => {
      const key = selectedStore
        ? `${report.customerName}-${report.customerStoreName || "no-store"}`
        : report.customerName;

      if (!grouped[key]) {
        grouped[key] = {
          clientId: key,
          clientName: report.customerName,
          storeName: report.customerStoreName,
          totalOrders: 0,
          totalAmount: 0,
          totalFees: 0,
          statusBreakdown: {},
          orders: [],
        };
      }

      grouped[key].totalOrders++;
      grouped[key].totalAmount += report.codAmount || 0;
      grouped[key].totalFees += report.deliveryFee || 0;
      grouped[key].statusBreakdown[report.status] =
        (grouped[key].statusBreakdown[report.status] || 0) + 1;
      grouped[key].orders.push(report);
    });

    return Object.values(grouped).sort((a, b) => b.totalOrders - a.totalOrders);
  }, [reports, selectedStore]);

  const filteredReports = useMemo(() => {
    if (!search.trim()) return groupedReports;

    const q = search.trim().toLowerCase();
    return groupedReports.filter((group) =>
      [group.clientName, group.storeName].some((field) =>
        (field || "").toLowerCase().includes(q)
      )
    );
  }, [groupedReports, search]);

  function downloadReport(format: "csv" | "excel") {
    if (filteredReports.length === 0) {
      showError("Download Error", "No data to download");
      return;
    }

    // Prepare headers
    const headers = [
      "Client Name",
      "Store Name",
      "Total Orders",
      "Total COD Amount",
      "Total Delivery Fees",
      "Pending Orders",
      "In Transit Orders",
      "Delivered Orders",
      "Returned Orders",
    ];

    // Prepare data
    const data = filteredReports.map((group) => [
      group.clientName,
      group.storeName || "",
      group.totalOrders.toString(),
      `SAR ${group.totalAmount.toFixed(2)}`,
      `SAR ${group.totalFees.toFixed(2)}`,
      (group.statusBreakdown["pending"] || 0).toString(),
      (group.statusBreakdown["in_transit"] || 0).toString(),
      (group.statusBreakdown["delivered"] || 0).toString(),
      (
        group.statusBreakdown["returned"] ||
        group.statusBreakdown["rto"] ||
        0
      ).toString(),
    ]);

    const csvContent = [headers, ...data]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type:
        format === "csv"
          ? "text/csv;charset=utf-8;"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}_report_${
      activeTab === "daily" ? `${fromDate}_to_${toDate}` : selectedMonth
    }.${format === "csv" ? "csv" : "xlsx"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Client & Store Reports</h1>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => downloadReport("csv")}
            leftIcon={<DownloadIcon size={18} />}
            disabled={filteredReports.length === 0}
          >
            Download CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => downloadReport("excel")}
            leftIcon={<DownloadIcon size={18} />}
            disabled={filteredReports.length === 0}
          >
            Download Excel
          </Button>
        </div>
      </div>

      <Tabs items={tabs} value={activeTab} onChange={setActiveTab} />

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {activeTab === "daily" ? (
            <>
              <div>
                <label className="text-[13px] text-slate-600 mb-2 block">
                  From Date
                </label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600 mb-2 block">
                  To Date
                </label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div>
              <label className="text-[13px] text-slate-600 mb-2 block">
                Month
              </label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-[13px] text-slate-600 mb-2 block">
              Client
            </label>
            <Select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.customerStoreName ||
                    `${client.firstName || ""} ${
                      client.lastName || ""
                    }`.trim() ||
                    client.email}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-[13px] text-slate-600 mb-2 block">
              Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">To be picked Up</option>
              <option value="assigned">Assigned</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="future_delivery">Future Delivery</option>
              <option value="returned">RTOs</option>
              <option value="lost_damaged">Lost & Damages</option>
            </Select>
          </div>

          <div>
            <label className="text-[13px] text-slate-600 mb-2 block">
              Group By
            </label>
            <Select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
            >
              <option value="">Client Only</option>
              <option value="store">Client + Store</option>
            </Select>
          </div>

          <div>
            <label className="text-[13px] text-slate-600 mb-2 block">
              Search
            </label>
            <Input
              leftIcon={<SearchIcon size={16} />}
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <div className="text-[13px] text-slate-500">Total Orders</div>
          <div className="mt-2 text-2xl font-semibold">
            {summary.totalOrders}
          </div>
        </Card>
        <Card>
          <div className="text-[13px] text-slate-500">Total COD Amount</div>
          <div className="mt-2 text-2xl font-semibold">
            SAR {summary.totalAmount.toFixed(2)}
          </div>
        </Card>
        <Card>
          <div className="text-[13px] text-slate-500">Total Delivery Fees</div>
          <div className="mt-2 text-2xl font-semibold">
            SAR {summary.totalFees.toFixed(2)}
          </div>
        </Card>
        <Card>
          <div className="text-[13px] text-slate-500">Unique Clients</div>
          <div className="mt-2 text-2xl font-semibold">
            {summary.uniqueClients}
          </div>
        </Card>
      </div>

      {/* Reports Table */}
      <Card
        header={
          <div className="font-semibold">
            {activeTab === "daily" ? "Daily" : "Monthly"} Reports by{" "}
            {selectedStore ? "Client & Store" : "Client"}
          </div>
        }
        padded={false}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-[13px] text-slate-500">
                {[
                  "Client Name",
                  ...(selectedStore ? ["Store Name"] : []),
                  "Total Orders",
                  "COD Amount",
                  "Delivery Fees",
                  "Pending",
                  "In Transit",
                  "Delivered",
                  "RTOs",
                ].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={selectedStore ? 9 : 8}
                    className="px-5 py-8 text-center text-slate-500"
                  >
                    Loading reports...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan={selectedStore ? 9 : 8}
                    className="px-5 py-8 text-center text-slate-500"
                  >
                    No data found for the selected criteria
                  </td>
                </tr>
              ) : (
                filteredReports.map((group) => (
                  <tr
                    key={group.clientId}
                    className="border-t border-slate-100"
                  >
                    <td className="px-5 py-3 font-medium">
                      {group.clientName}
                    </td>
                    {selectedStore && (
                      <td className="px-5 py-3">{group.storeName || "—"}</td>
                    )}
                    <td className="px-5 py-3">{group.totalOrders}</td>
                    <td className="px-5 py-3">
                      SAR {group.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3">SAR {group.totalFees.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      {group.statusBreakdown["pending"] || 0}
                    </td>
                    <td className="px-5 py-3">
                      {group.statusBreakdown["in_transit"] || 0}
                    </td>
                    <td className="px-5 py-3">
                      {group.statusBreakdown["delivered"] || 0}
                    </td>
                    <td className="px-5 py-3">
                      {(group.statusBreakdown["returned"] || 0) +
                        (group.statusBreakdown["rto"] || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
