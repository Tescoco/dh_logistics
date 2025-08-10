"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { UploadIcon, SearchIcon, DownloadIcon } from "@/components/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useRouter } from "next/navigation";

export default function DeliveryStatusPage() {
  const router = useRouter();
  // Independent filters for bulk update vs list view
  const [bulkStatusFilter, setBulkStatusFilter] = useState<string>("");
  const [id, setId] = useState<string>("");
  const [listStatusFilter, setListStatusFilter] = useState<string>("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<
    {
      _id: string;
      customerName: string;
      deliveryAddress: string;
      status: string;
      updatedAt: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [viewRow, setViewRow] = useState<null | {
    _id: string;
    customerName: string;
    deliveryAddress: string;
    status: string;
    updatedAt: string;
  }>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Bulk upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  type PreviewRow = {
    index: number;
    raw: string;
    valid: boolean;
    reason?: string;
    values: string[];
  };
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const url = new URL("/api/deliveries", window.location.origin);
    if (listStatusFilter) url.searchParams.set("status", listStatusFilter);
    fetch(url.toString())
      .then((r) => r.json())
      .then((d) => mounted && setRows(d.deliveries ?? []))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [listStatusFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r._id.slice(-8), r.customerName, r.deliveryAddress, r.status]
        .filter(Boolean)
        .some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [rows, query]);

  async function handleBulkUpdate() {
    const newStatus = bulkStatusFilter || "in_transit";
    if (!id) return;
    const ids = id
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
      // refresh list
      setListStatusFilter((s: string) => s);
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data?.error ?? "Failed to update");
    }
  }

  async function handleUpload(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/deliveries/upload", {
      method: "POST",
      body: form,
    });
    if (res.ok) {
      setListStatusFilter((s: string) => s);
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data?.error ?? "Upload failed");
    }
  }

  async function handleFileChange(f: File | null) {
    setCsvFile(f);
    setPreviewRows([]);
    setParseError(null);
    if (!f) return;
    try {
      const text = await f.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length === 0) {
        setParseError("CSV is empty");
        return;
      }
      let startIdx = 0;
      const headerLower = lines[0].toLowerCase();
      let headerUsed = false;

      const commonFields = [
        "reference",
        "customer",
        "phone",
        "address",
        "package",
        "description",
      ];
      const hasCommonFields = commonFields.some((field) =>
        headerLower.includes(field)
      );

      if (hasCommonFields) {
        startIdx = 1;
        headerUsed = true;
      } else {
        const firstLineParts = lines[0].split(",").map((p) => p.trim());
        if (
          firstLineParts.length > 3 &&
          firstLineParts.every((p) => p.length > 0)
        ) {
          startIdx = 0;
          headerUsed = false;
        } else {
          startIdx = 1;
          headerUsed = true;
        }
      }
      if (headerUsed) {
        const headerParts = lines[0].split(",").map((p) => p.trim());
        setColumns(headerParts);
      } else {
        const sampleParts = lines[startIdx].split(",").map((p) => p.trim());
        setColumns(sampleParts.map((_, i) => `col${i + 1}`));
      }
      const parsed: PreviewRow[] = [];
      for (let i = startIdx; i < lines.length; i++) {
        const raw = lines[i];
        const parts = raw.split(",").map((p) => p.trim());
        let valid = true;
        let reason = "";
        if (parts.length < 3) {
          valid = false;
          reason =
            "Minimum 3 columns required (reference, customer name, phone)";
        } else {
          const reference = parts[0] ?? "";
          const customerName = parts[1] ?? "";
          const customerPhone = parts[2] ?? "";
          const missing: string[] = [];
          if (!reference.trim()) missing.push("reference");
          if (!customerName.trim()) missing.push("customer name");
          if (!customerPhone.trim()) missing.push("customer phone");
          if (missing.length > 0) {
            valid = false;
            reason = `Missing required fields: ${missing.join(", ")}`;
          }
          if (
            customerPhone &&
            !/^[+]?[0-9\s\-()]{7,15}$/.test(customerPhone.trim())
          ) {
            valid = false;
            reason = reason
              ? `${reason}; invalid phone format`
              : "Invalid phone format";
          }
          if (
            parts[7] &&
            parts[7].trim().toLowerCase() !== "express" &&
            parts[7].trim().toLowerCase() !== "standard"
          ) {
            parts[7] = "standard";
          }
          if (
            parts[8] &&
            parts[8].trim().toLowerCase() !== "cod" &&
            parts[8].trim().toLowerCase() !== "prepaid"
          ) {
            valid = false;
            reason = reason
              ? `${reason}; invalid payment method its should be cod or prepaid`
              : "Invalid payment method its should be cod or prepaid";
          }
        }
        parsed.push({
          valid,
          index: i - startIdx + 1,
          raw,
          reason: valid ? undefined : reason,
          values: parts,
        });
      }
      if (parsed.length === 0) {
        setParseError(
          "No valid delivery data found. Expected columns: reference, customer name, phone, address, etc."
        );
        return;
      }
      setPreviewRows(parsed);
    } catch (e) {
      setParseError("Failed to read CSV file");
    }
  }

  function downloadTemplate() {
    const headers = [
      "reference,customerName,customerPhone,originAddress,deliveryAddress,packageType,description,priority,paymentMethod,deliveryFee,codAmount,notes",
    ].join("\n");
    const blob = new Blob([headers], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deliveries_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function startUpload() {
    if (!csvFile) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", csvFile);
      const res = await fetch("/api/deliveries/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        alert(error?.error ?? "Upload failed");
        return;
      }
      // Refresh the page data
      setListStatusFilter((s: string) => s);
      setCsvFile(null);
      setPreviewRows([]);
      setParseError(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card header={<div className="font-semibold">Bulk Delivery Upload</div>}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[13px] text-slate-600">
              Upload a CSV file containing delivery information
            </div>
          </div>
          <Button
            variant="secondary"
            leftIcon={<DownloadIcon size={16} />}
            onClick={downloadTemplate}
          >
            Download Template
          </Button>
        </div>
        <div className="mt-4 border-2 border-dashed border-sky-200 rounded-xl p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-sky-50 text-sky-600 grid place-items-center mb-3">
            <UploadIcon size={20} />
          </div>
          <div className="text-slate-700 font-medium">
            Drop your CSV file here
          </div>
          <div className="text-[12px] text-slate-500">
            or click to browse and select
          </div>
          <div className="mt-4">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              hidden
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
            <Button
              leftIcon={<UploadIcon size={16} />}
              onClick={() => fileRef.current?.click()}
            >
              Choose File
            </Button>
            {csvFile && (
              <div className="mt-2 text-sm text-slate-600">
                Selected: {csvFile.name}
              </div>
            )}
            {parseError && (
              <div className="mt-2 text-sm text-rose-600">{parseError}</div>
            )}
          </div>
        </div>
      </Card>

      {previewRows.length > 0 && (
        <Card
          header={<div className="font-semibold ">Preview Data</div>}
          padded={false}
          className="overflow-hidden max-w-full"
          twin={true}
          twinContent={
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="gradient"
                onClick={startUpload}
                disabled={
                  !csvFile || previewRows.every((r) => !r.valid) || uploading
                }
              >
                {uploading ? "Uploading..." : "Start Upload"}
              </Button>
            </div>
          }
        >
          <div className="px-6 py-3 text-[13px] text-slate-600">
            Showing first {Math.min(previewRows.length, 20)} of{" "}
            {previewRows.length} row(s). Valid:{" "}
            {previewRows.filter((r) => r.valid).length}, Invalid:{" "}
            {previewRows.filter((r) => !r.valid).length}
          </div>
          {/* Desktop/tablet table */}
          <div className="hidden sm:block overflow-x-auto w-full max-w-full min-w-0">
            <table className="min-w-max table-auto">
              <thead>
                <tr className="text-left text-[13px] text-slate-500">
                  <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[80px]">
                    Valid
                  </th>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3 font-medium whitespace-nowrap min-w-[120px]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 20).map((r, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex rounded-full px-2 py-0.5 text-[12px] font-medium whitespace-nowrap " +
                          (r.valid
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-rose-50 text-rose-700 ring-1 ring-rose-200")
                        }
                        title={r.reason || undefined}
                      >
                        {r.valid ? "Valid" : "Invalid"}
                      </span>
                    </td>
                    {r.values.map((value, colIdx) => (
                      <td
                        key={colIdx}
                        className="px-4 py-3 text-slate-800 whitespace-nowrap max-w-[200px] truncate"
                        title={value}
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="sm:hidden divide-y border-t border-slate-100">
            {previewRows.slice(0, 20).map((r, idx) => (
              <div key={idx} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] text-slate-500">
                    Row {idx + 1}
                  </div>
                  <span
                    className={
                      "inline-flex rounded-full px-2 py-0.5 text-[12px] font-medium " +
                      (r.valid
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-rose-50 text-rose-700 ring-1 ring-rose-200")
                    }
                  >
                    {r.valid ? "Valid" : "Invalid"}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {r.values.slice(0, 4).map((value, colIdx) => (
                    <div key={colIdx} className="text-sm">
                      <div className="text-[12px] text-slate-500">
                        {columns[colIdx] ?? `col${colIdx + 1}`}
                      </div>
                      <div
                        className="font-medium text-slate-800 truncate"
                        title={value}
                      >
                        {value || "—"}
                      </div>
                    </div>
                  ))}
                </div>
                {!r.valid && r.reason && (
                  <div className="mt-2 text-[12px] text-rose-600">
                    {r.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card header={<div className="font-semibold">Bulk Status Update</div>}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr_auto]">
          <Select
            value={bulkStatusFilter}
            onChange={(e) =>
              setBulkStatusFilter((e.target as HTMLSelectElement).value)
            }
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="assigned">Assigned</option>
            <option value="returned">Returned</option>
          </Select>
          <Input
            placeholder="ID1, ID2, ID3..."
            value={id}
            onChange={(e) => setId((e.target as HTMLInputElement).value)}
          />
          <Button onClick={handleBulkUpdate}>Update Selected</Button>
        </div>
      </Card>

      <Card
        header={<div className="font-semibold">Recent Deliveries</div>}
        padded={false}
      >
        <div className="p-5 flex items-center gap-4">
          <Select
            className="w-40"
            value={listStatusFilter}
            onChange={(e) =>
              setListStatusFilter((e.target as HTMLSelectElement).value)
            }
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="assigned">Assigned</option>
            <option value="returned">Returned</option>
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
                  "Delivery ID",
                  "Customer",
                  "Address",
                  "Status",
                  "Last Updated",
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
                    {new Date(d.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-[#0EA5E9]">
                    <button
                      onClick={() => setViewRow(d)}
                      className="hover:underline"
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
        open={!!viewRow}
        onClose={() => setViewRow(null)}
        title="Delivery Details"
      >
        {viewRow && (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-slate-500">ID:</span>{" "}
              <span className="font-medium">{viewRow._id}</span>
            </div>
            <div>
              <span className="text-slate-500">Customer:</span>{" "}
              <span className="font-medium">{viewRow.customerName}</span>
            </div>
            <div>
              <span className="text-slate-500">Address:</span>{" "}
              <span className="font-medium">{viewRow.deliveryAddress}</span>
            </div>
            <div>
              <span className="text-slate-500">Status:</span>{" "}
              <span className="font-medium">{viewRow.status}</span>
            </div>
            <div>
              <span className="text-slate-500">Updated:</span>{" "}
              <span className="font-medium">
                {new Date(viewRow.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
