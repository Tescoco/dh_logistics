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
  PackageIcon,
  TruckIcon,
  CheckIcon,
  RefreshIcon,
  DownloadIcon,
  LinkIcon,
  TrashIcon,
} from "@/components/icons";

type ReportRow = {
  name: string;
  range: string;
  generatedOn: string;
  format: "PDF" | "Excel" | "CSV";
  status: "Ready" | "Processing";
};

type CODDelivery = {
  _id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  codAmount: number;
  deliveryFee: number;
  status: string;
  assignedDriver: string;
  createdAt: string;
};

export default function CodReportPage() {
  const [fromDate, setFromDate] = useState("2025-01-01");
  const [toDate, setToDate] = useState("2025-01-31");
  const [format, setFormat] = useState<ReportRow["format"]>("PDF");
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState({
    totalAmount: 0,
    deliveries: 0,
    pendingAmount: 0,
    collectedAmount: 0,
  });
  const [history, setHistory] = useState<ReportRow[]>([]);
  const [generating, setGenerating] = useState(false);

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<CODDelivery[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const url = new URL("/api/cod", window.location.origin);
    url.searchParams.set("from", fromDate);
    url.searchParams.set("to", toDate);
    fetch(url.toString())
      .then((r) => r.json())
      .then((d) => setSummary(d))
      .catch(() => {});
  }, [fromDate, toDate]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return history;
    return history.filter((r) =>
      [r.name, r.range, r.generatedOn, r.format, r.status]
        .map(String)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [search, history]);

  useEffect(() => {
    fetch("/api/reports/cod")
      .then((r) => r.json())
      .then((d) => setHistory(d.reports || []))
      .catch(() => {});
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/reports/cod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromDate, to: toDate, format }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d?.error ?? "Failed to generate report");
        return;
      }
      // refresh history
      const h = await fetch("/api/reports/cod").then((r) => r.json());
      setHistory(h.reports || []);
    } finally {
      setGenerating(false);
    }
  }

  async function handlePreview() {
    setPreviewLoading(true);
    try {
      const url = new URL("/api/cod", window.location.origin);
      url.searchParams.set("from", fromDate);
      url.searchParams.set("to", toDate);
      url.searchParams.set("detailed", "true");

      const res = await fetch(url.toString());
      if (!res.ok) {
        alert("Failed to load preview data");
        return;
      }

      const data = await res.json();
      setPreviewData(data.deliveries || []);
      setPreviewOpen(true);
    } catch (error) {
      alert("Failed to load preview data");
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Generate new report */}
      <Card
        header={<div className="font-semibold">Generate New COD Report</div>}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_200px_200px_auto] md:items-end">
          <div>
            <div className="text-[12px] text-slate-500 mb-1">From Date</div>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <div className="text-[12px] text-slate-500 mb-1">To Date</div>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div>
            <div className="text-[12px] text-slate-500 mb-1">Report Format</div>
            <Select
              value={format}
              onChange={(e) => setFormat(e.target.value as ReportRow["format"])}
            >
              <option value="PDF">PDF</option>
              <option value="Excel">Excel</option>
              <option value="CSV">CSV</option>
            </Select>
          </div>
          <div className="flex items-center gap-3 md:justify-end">
            <Button
              leftIcon={<UploadIcon size={16} />}
              onClick={handleGenerate}
              loading={generating}
            >
              Generate Report
            </Button>
            <Button
              variant="secondary"
              loading={previewLoading}
              onClick={handlePreview}
            >
              Preview
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total COD Amount",
            value: `₹${summary.totalAmount.toLocaleString()}`,
            Icon: PackageIcon,
            color: "bg-blue-100 text-blue-600",
          },
          {
            label: "COD Deliveries",
            value: summary.deliveries,
            Icon: TruckIcon,
            color: "bg-sky-100 text-sky-600",
          },
          {
            label: "Pending COD",
            value: `₹${summary.pendingAmount.toLocaleString()}`,
            Icon: RefreshIcon,
            color: "bg-amber-100 text-amber-600",
          },
          {
            label: "Collected COD",
            value: `₹${summary.collectedAmount.toLocaleString()}`,
            Icon: CheckIcon,
            color: "bg-emerald-100 text-emerald-600",
          },
        ].map(({ label, value, Icon, color }) => (
          <Card key={label} className="p shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {String(value)}
                </p>
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

      {/* Report history */}
      <Card
        header={<div className="font-semibold">Report History</div>}
        padded={false}
      >
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="ml-auto w-72">
            <Input
              leftIcon={<SearchIcon size={16} />}
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="h-10 w-10 rounded-md border border-slate-200 grid place-items-center text-slate-500"
            aria-label="More"
          >
            ▾
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-[13px] text-slate-500">
                {[
                  "Report Name",
                  "Date Range",
                  "Generated On",
                  "Format",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="px-6 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.name} className="border-t border-slate-100">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-sm bg-sky-600"
                        aria-hidden
                      />
                      <span className="text-[#0EA5E9] hover:underline font-medium">
                        {r.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-700">{r.range}</td>
                  <td className="px-6 py-3 text-slate-700">{r.generatedOn}</td>
                  <td className="px-6 py-3">
                    <Badge variant="neutral">{r.format}</Badge>
                  </td>
                  <td className="px-6 py-3">
                    <Badge
                      variant={r.status === "Ready" ? "success" : "warning"}
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-[#0EA5E9]">
                    <div className="flex items-center gap-3">
                      <IconButton
                        label="Download"
                        onClick={() => {
                          // Create a temporary download link
                          const link = document.createElement("a");
                          link.href = `/api/reports/cod?name=${encodeURIComponent(
                            r.name
                          )}&format=${r.format}&type=download`;
                          link.download = `${r.name}.${r.format.toLowerCase()}`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <DownloadIcon size={16} />
                      </IconButton>
                      <IconButton
                        label="View"
                        onClick={async () => {
                          // Show the same report data in preview modal
                          setPreviewLoading(true);
                          try {
                            // Extract date range from report name or use current dates
                            const url = new URL(
                              "/api/cod",
                              window.location.origin
                            );
                            url.searchParams.set("from", fromDate);
                            url.searchParams.set("to", toDate);
                            url.searchParams.set("detailed", "true");

                            const res = await fetch(url.toString());
                            if (!res.ok) {
                              alert("Failed to load report data");
                              return;
                            }

                            const data = await res.json();
                            setPreviewData(data.deliveries || []);
                            setPreviewOpen(true);
                          } catch (error) {
                            alert("Failed to load report data");
                          } finally {
                            setPreviewLoading(false);
                          }
                        }}
                      >
                        <LinkIcon size={16} />
                      </IconButton>
                      <IconButton
                        label="Delete"
                        onClick={async () => {
                          const ok = confirm("Delete this report?");
                          if (!ok) return;
                          try {
                            await fetch(
                              `/api/reports/cod?name=${encodeURIComponent(
                                r.name
                              )}`,
                              { method: "DELETE" }
                            );
                            setHistory((prev) =>
                              prev.filter((h) => h.name !== r.name)
                            );
                          } catch {}
                        }}
                      >
                        <TrashIcon size={16} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 gap-2">
          <Button variant="secondary" size="sm">
            Previous
          </Button>
          <button className="h-9 w-9 rounded-md bg-[#0EA5E9] text-white text-sm font-medium">
            1
          </button>
        </div>
      </Card>

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`COD Report Preview - ${new Date(
          fromDate
        ).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`}
        widthClassName="max-w-6xl"
      >
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {previewData.length}
              </div>
              <div className="text-sm text-slate-500">Total Deliveries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                ₹
                {previewData
                  .reduce((sum, d) => sum + (d.codAmount || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-slate-500">Total COD Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ₹
                {previewData
                  .reduce((sum, d) => sum + (d.deliveryFee || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-slate-500">Total Delivery Fees</div>
            </div>
          </div>

          {/* Deliveries Table */}
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full">
              <thead className="sticky top-0 bg-white border-b border-slate-200">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-3 py-2 font-medium">Reference</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Phone</th>
                  <th className="px-3 py-2 font-medium">Address</th>
                  <th className="px-3 py-2 font-medium">COD Amount</th>
                  <th className="px-3 py-2 font-medium">Delivery Fee</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Driver</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((delivery) => (
                  <tr
                    key={delivery._id}
                    className="border-t border-slate-100 text-sm"
                  >
                    <td className="px-3 py-2 font-medium text-blue-600">
                      {delivery.reference}
                    </td>
                    <td className="px-3 py-2">{delivery.customerName}</td>
                    <td className="px-3 py-2">{delivery.customerPhone}</td>
                    <td
                      className="px-3 py-2 max-w-xs truncate"
                      title={delivery.deliveryAddress}
                    >
                      {delivery.deliveryAddress}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      ₹{delivery.codAmount?.toLocaleString() || "0"}
                    </td>
                    <td className="px-3 py-2">
                      ₹{delivery.deliveryFee?.toLocaleString() || "0"}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          delivery.status === "delivered"
                            ? "success"
                            : delivery.status === "in_transit"
                            ? "info"
                            : delivery.status === "pending"
                            ? "warning"
                            : "default"
                        }
                      >
                        {delivery.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">{delivery.assignedDriver}</td>
                    <td className="px-3 py-2">
                      {new Date(delivery.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No COD deliveries found for the selected date range.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setPreviewOpen(false);
                handleGenerate();
              }}
            >
              Generate Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
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
