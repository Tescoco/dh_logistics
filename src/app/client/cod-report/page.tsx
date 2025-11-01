"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  SearchIcon,
  DownloadIcon,
  LinkIcon,
  TrashIcon,
  EyeIcon,
  ChevronDownIcon,
} from "@/components/icons";
import { useToast } from "@/contexts/ToastContext";

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
  returnOrderRate: number;
  status: string;
  createdAt: string;
};

export default function CodReportPage() {
  const { showError, showSuccess } = useToast();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdowns = document.querySelectorAll(".dropdown-menu");
      dropdowns.forEach((dropdown) => {
        if (!dropdown.contains(event.target as Node)) {
          dropdown.classList.add("hidden");
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  // 30 days range from now
  const [fromDate, setFromDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0]
  );
  const [toDate, setToDate] = useState(
    new Date(new Date().setDate(new Date().getDate()))
      .toISOString()
      .split("T")[0]
  );
  const [format] = useState<ReportRow["format"]>("PDF");
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<ReportRow[]>([]);
  const [generating, setGenerating] = useState(false);

  const [clickedFrom, setClickedFrom] = useState<"preview" | "generate">(
    "generate"
  );
  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<CODDelivery[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

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
        showError(
          "Report Generation Failed",
          d?.error ?? "Failed to generate report"
        );
        return;
      }
      showSuccess(
        "Report Generated",
        "COD report has been generated successfully"
      );
      // refresh history
      const h = await fetch("/api/reports/cod").then((r) => r.json());
      setHistory(h.reports || []);
    } finally {
      setGenerating(false);
    }
  }

  function extractDatesFromRange(rangeString: string) {
    // Extract dates from format "MM/DD/YYYY - MM/DD/YYYY"
    const dates = rangeString.split(" - ");
    if (dates.length === 2) {
      try {
        const fromDateObj = new Date(dates[0]);
        const toDateObj = new Date(dates[1]);

        // Format as YYYY-MM-DD without timezone conversion
        const from =
          fromDateObj.getFullYear() +
          "-" +
          String(fromDateObj.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(fromDateObj.getDate()).padStart(2, "0");
        const to =
          toDateObj.getFullYear() +
          "-" +
          String(toDateObj.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(toDateObj.getDate()).padStart(2, "0");

        return { from, to };
      } catch {
        // Fallback to current dates if parsing fails
        return { from: fromDate, to: toDate };
      }
    }
    return { from: fromDate, to: toDate };
  }

  async function downloadReport() {
    const { from, to } = extractDatesFromRange(
      `${new Date(fromDate).toLocaleDateString()} - ${new Date(
        toDate
      ).toLocaleDateString()}`
    );
    const link = document.createElement("a");
    link.href = `/api/cod?from=${from}&to=${to}&format=${format}&download=true`;
    link.download = `COD_Report_${from}_to_${to}.${format.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* Generate new report */}
      <Card header={<div className="font-semibold">View COD Report</div>}>
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
        </div>
      </Card>

      {/* Summary stats */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total COD Amount",
            value: `SAR ${summary.totalAmount.toLocaleString()}`,
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
            value: `SAR ${summary.pendingAmount.toLocaleString()}`,
            Icon: RefreshIcon,
            color: "bg-amber-100 text-amber-600",
          },
          {
            label: "Collected COD",
            value: `SAR ${summary.collectedAmount.toLocaleString()}`,
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
      </div> */}

      {/* Report history */}
      <Card
        header={<div className="font-semibold">Report History</div>}
        padded={false}
      >
        <div className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:ml-auto sm:w-72">
            <Input
              leftIcon={<SearchIcon size={16} />}
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center">
            <button
              className="h-10 w-10 rounded-md border border-slate-200 grid place-items-center text-slate-500"
              aria-label="More"
            >
              ▾
            </button>
          </div>
        </div>
        {/* Desktop/tablet table */}
        <div className="hidden sm:block overflow-x-auto">
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
                ].map((h) => {
                  const hideOnMobile = [
                    "Generated On",
                    "Format",
                    "Status",
                  ].includes(h);
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
                  <td className="px-6 py-3 text-slate-700 hidden sm:table-cell">
                    {r.generatedOn}
                  </td>
                  <td className="px-6 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">{r.format}</Badge>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const dropdown = e.currentTarget
                              .nextElementSibling as HTMLElement;
                            dropdown.classList.toggle("hidden");
                          }}
                          className="p-1 hover:bg-slate-100 rounded"
                        >
                          <ChevronDownIcon size={12} />
                        </button>
                        <div className="dropdown-menu absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 hidden min-w-[120px]">
                          {(["PDF", "CSV", "Excel"] as const)
                            .filter((f) => f !== r.format)
                            .map((formatOption) => (
                              <button
                                key={formatOption}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const { from, to } = extractDatesFromRange(
                                    r.range
                                  );
                                  const link = document.createElement("a");
                                  link.href = `/api/cod?from=${from}&to=${to}&format=${formatOption}&download=true`;
                                  link.download = `${
                                    r.name
                                  }.${formatOption.toLowerCase()}`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  (
                                    e.currentTarget.parentElement as HTMLElement
                                  ).classList.add("hidden");
                                }}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50 first:rounded-t-md last:rounded-b-md"
                              >
                                {formatOption}
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 hidden sm:table-cell capitalize">
                    <Badge
                      variant={r.status === "Ready" ? "success" : "warning"}
                    >
                      {r.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-[#0EA5E9]">
                    <div className="flex items-center gap-3">
                      <IconButton
                        label="Download"
                        onClick={() => {
                          // Extract date range from the report and use COD API for download
                          const { from, to } = extractDatesFromRange(r.range);
                          const link = document.createElement("a");
                          link.href = `/api/cod?from=${from}&to=${to}&format=${r.format}&download=true`;
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
                          // Show the report data in preview modal using the report's actual date range
                          setClickedFrom("generate");
                          setPreviewLoading(true);
                          try {
                            const { from, to } = extractDatesFromRange(r.range);
                            const url = new URL(
                              "/api/cod",
                              window.location.origin
                            );
                            url.searchParams.set("from", from);
                            url.searchParams.set("to", to);
                            url.searchParams.set("detailed", "true");

                            const res = await fetch(url.toString());
                            if (!res.ok) {
                              showError(
                                "Load Failed",
                                "Failed to load report data"
                              );
                              return;
                            }

                            const data = await res.json();
                            setPreviewData(data.deliveries || []);
                            setPreviewOpen(true);
                          } catch {
                            showError(
                              "Load Failed",
                              "Failed to load report data"
                            );
                          } finally {
                            setPreviewLoading(false);
                          }
                        }}
                      >
                        <EyeIcon size={16} />
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

        {/* Mobile cards */}
        <div className="sm:hidden">
          <div className="divide-y border-t border-slate-100">
            {filtered.map((r) => (
              <div key={r.name} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[#0EA5E9] font-semibold">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.range}</div>
                  </div>
                  <Badge variant={r.status === "Ready" ? "success" : "warning"}>
                    {r.status.replace("_", " ")}
                  </Badge>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-500">Generated:</span>
                    <div className="font-medium text-slate-700">
                      {r.generatedOn}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Format:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">
                        {r.format}
                      </span>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const dropdown = e.currentTarget
                              .nextElementSibling as HTMLElement;
                            dropdown.classList.toggle("hidden");
                          }}
                          className="p-1 hover:bg-slate-100 rounded"
                        >
                          <ChevronDownIcon size={12} />
                        </button>
                        <div className="dropdown-menu absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 hidden min-w-[120px]">
                          {(["PDF", "CSV", "Excel"] as const).map(
                            (formatOption) => (
                              <button
                                key={formatOption}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const { from, to } = extractDatesFromRange(
                                    r.range
                                  );
                                  const link = document.createElement("a");
                                  link.href = `/api/cod?from=${from}&to=${to}&format=${formatOption}&download=true`;
                                  link.download = `${
                                    r.name
                                  }.${formatOption.toLowerCase()}`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  (
                                    e.currentTarget.parentElement as HTMLElement
                                  ).classList.add("hidden");
                                }}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50 first:rounded-t-md last:rounded-b-md"
                              >
                                Download as {formatOption}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 text-[#0EA5E9]">
                  <IconButton
                    label="Download"
                    onClick={() => {
                      const { from, to } = extractDatesFromRange(r.range);
                      const link = document.createElement("a");
                      link.href = `/api/cod?from=${from}&to=${to}&format=${r.format}&download=true`;
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
                      setClickedFrom("generate");
                      setPreviewLoading(true);
                      try {
                        const { from, to } = extractDatesFromRange(r.range);
                        const url = new URL("/api/cod", window.location.origin);
                        url.searchParams.set("from", from);
                        url.searchParams.set("to", to);
                        url.searchParams.set("detailed", "true");
                        const res = await fetch(url.toString());
                        if (!res.ok) {
                          showError(
                            "Load Failed",
                            "Failed to load report data"
                          );
                          return;
                        }
                        const data = await res.json();
                        setPreviewData(data.deliveries || []);
                        setPreviewOpen(true);
                      } catch {
                        showError("Load Failed", "Failed to load report data");
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
                          `/api/reports/cod?name=${encodeURIComponent(r.name)}`,
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
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end px-6 py-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              Previous
            </Button>
            <button className="h-9 w-9 rounded-md bg-[#0EA5E9] text-white text-sm font-medium">
              1
            </button>
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {previewData.length}
              </div>
              <div className="text-sm text-slate-500">Total Deliveries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                SAR
                {previewData
                  .reduce((sum, d) => sum + (d.codAmount || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-slate-500">Total COD Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                SAR
                {previewData
                  .reduce(
                    (sum, d) =>
                      sum +
                      (d.status === "returned" || d.status === "returning"
                        ? 0
                        : d.deliveryFee || 0),
                    0
                  )
                  .toLocaleString()}
              </div>
              <div className="text-sm text-slate-500">Total Delivery Fee</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                SAR
                {previewData
                  .reduce(
                    (sum, d) =>
                      sum +
                      (d.status === "returned" || d.status === "returning"
                        ? d.returnOrderRate || 0
                        : 0),
                    0
                  )
                  .toLocaleString()}
              </div>
              <div className="text-sm text-slate-500">Total RTO Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {previewData
                  .reduce(
                    (sum, d) => sum + (d.status === "delivered" ? 1 : 0),
                    0
                  )
                  .toLocaleString()}
              </div>
              <div className="text-sm text-slate-500">
                Total Completed Deliveries
              </div>
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
                  <th className="px-3 py-2 font-medium">RTO Amount</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((delivery) => (
                  <tr
                    key={delivery._id}
                    className="border-t border-slate-100 text-sm"
                  >
                    <td className="px-3 py-2 font-medium text-blue-600 uppercase">
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
                      SAR {delivery.codAmount?.toLocaleString() || "0"}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      SAR{" "}
                      {(delivery.status === "returned" ||
                      delivery.status === "returning"
                        ? 0
                        : delivery.deliveryFee || 0
                      )?.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      SAR{" "}
                      {delivery.status === "returned" ||
                      delivery.status === "returning"
                        ? (delivery.returnOrderRate || 0)?.toLocaleString()
                        : "0"}
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
            {clickedFrom === "preview" ? (
              <Button
                onClick={() => {
                  setPreviewOpen(false);
                  handleGenerate();
                }}
              >
                Generate Report
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setPreviewOpen(false);
                  downloadReport();
                }}
              >
                Download Report
              </Button>
            )}
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
