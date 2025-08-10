"use client";

import React, { useMemo, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  UploadIcon,
  DownloadIcon,
  FilterIcon,
  ListIcon,
  CalendarIcon,
  XIcon,
} from "@/components/icons";
import { useRouter } from "next/navigation";
export default function BulkDeliveriesUploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  type PreviewRow = {
    index: number;
    raw: string;
    valid: boolean;
    reason?: string;
    values: string[];
  };
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [validAddress, setValidAddress] = useState(true);
  const [checkDuplicate, setCheckDuplicate] = useState(true);
  const [skipInvalid, setSkipInvalid] = useState(false);
  const [emailNotify, setEmailNotify] = useState(false);
  const [serviceType, setServiceType] = useState("Standard Delivery");
  const [priority, setPriority] = useState("Standard");
  const [batchName, setBatchName] = useState(
    `Batch_${new Date().toISOString().slice(0, 10).replace(/-/g, "_")}`
  );
  const [mode, setMode] = useState("Process Immediately");
  const [uploading, setUploading] = useState(false);

  const canStart = useMemo(
    () => !!file && rows.some((r) => r.valid),
    [file, rows]
  );

  async function handleFileChange(f: File | null) {
    setFile(f);
    setRows([]);
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

      // Check if first line looks like headers (contains common delivery fields)
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
        // If first line doesn't look like headers, check if it has data-like content
        const firstLineParts = lines[0].split(",").map((p) => p.trim());
        if (
          firstLineParts.length > 3 &&
          firstLineParts.every((part) => part.length > 0)
        ) {
          // Assume first line is data, create generic headers
          startIdx = 0;
          headerUsed = false;
        } else {
          // Assume first line is headers
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

        // Basic validation for delivery data
        let valid = true;
        let reason = "";

        if (parts.length < 3) {
          valid = false;
          reason =
            "Minimum 3 columns required (reference, customer name, phone)";
        } else {
          // Check for required fields (assuming first few columns are reference, customer, phone)
          const reference = parts[0] ?? "";
          const customerName = parts[1] ?? "";
          const customerPhone = parts[2] ?? "";

          const missingFields = [];
          if (!reference.trim()) missingFields.push("reference");
          if (!customerName.trim()) missingFields.push("customer name");
          if (!customerPhone.trim()) missingFields.push("customer phone");

          if (missingFields.length > 0) {
            valid = false;
            reason = `Missing required fields: ${missingFields.join(", ")}`;
          }

          // Basic phone validation
          if (
            customerPhone &&
            !/^[+]?[0-9\s\-()]{7,15}$/.test(customerPhone.trim())
          ) {
            valid = false;
            reason = reason
              ? `${reason}; invalid phone format`
              : "Invalid phone format";
          }

          //   if priority is not express or standard, set it to standard
          if (
            parts[6] &&
            parts[6].toLowerCase() !== "express" &&
            parts[6].toLowerCase() !== "standard"
          ) {
            parts[6] = "standard";
          }

          if (
            parts[7] &&
            parts[7].toLowerCase() !== "cod" &&
            parts[7].toLowerCase() !== "prepaid"
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
      setRows(parsed);
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
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/deliveries/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error);
        return;
      }
      router.push("/client/track");
      setFile(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">
        Bulk Deliveries Upload
      </h1>

      {/* Upload Instructions */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="h-9 w-9 rounded-lg bg-sky-50 text-sky-600 grid place-items-center">
            <ListIcon size={18} />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Upload Instructions</div>
            <ul className="mt-2 text-[13px] text-slate-600 space-y-1 list-disc pl-5">
              <li>Upload a CSV file containing delivery information</li>
              <li>Maximum file size: 10MB</li>
              <li>Maximum 1000 deliveries per upload</li>
              <li>Ensure all required fields are included</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* CSV Template */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">CSV Template</div>
            <div className="text-[12px] text-slate-500">
              Download the template file to ensure proper formatting
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
      </Card>

      {/* Upload CSV */}
      <Card>
        <div className="border-2 border-dashed border-sky-200 rounded-xl p-8 text-center">
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
            {file && (
              <div className="mt-2 text-sm text-slate-600">
                Selected: {file.name}
              </div>
            )}
            {parseError && (
              <div className="mt-2 text-sm text-rose-600">{parseError}</div>
            )}
          </div>
        </div>
      </Card>

      {rows.length > 0 && (
        <Card
          header={<div className="font-semibold ">Preview Data</div>}
          padded={false}
          className="overflow-hidden max-w-full"
        >
          <div className="px-6 py-3 text-[13px] text-slate-600">
            Showing first {Math.min(rows.length, 20)} of {rows.length} row(s).
            Valid: {rows.filter((r) => r.valid).length}, Invalid:{" "}
            {rows.filter((r) => !r.valid).length}
          </div>
          <div className="overflow-x-auto w-full max-w-full min-w-0">
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
                {rows.slice(0, 20).map((r, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="relative group">
                        <span
                          className={
                            "inline-flex rounded-full px-2 py-0.5 text-[12px] font-medium cursor-help whitespace-nowrap " +
                            (r.valid
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-rose-50 text-rose-700 ring-1 ring-rose-200")
                          }
                        >
                          {r.valid ? "Valid" : "Invalid"}
                        </span>
                        {!r.valid && r.reason && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-[11px] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs">
                            {r.reason}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                          </div>
                        )}
                      </div>
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
        </Card>
      )}

      {/* Validation Options */}
      <Card header={<div className="font-semibold">Validation Options</div>}>
        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={validAddress}
              onChange={(e) => setValidAddress(e.target.checked)}
            />
            Validate addresses before processing
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={checkDuplicate}
              onChange={(e) => setCheckDuplicate(e.target.checked)}
            />
            Check for duplicate entries
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={skipInvalid}
              onChange={(e) => setSkipInvalid(e.target.checked)}
            />
            Skip invalid entries and process valid ones
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={emailNotify}
              onChange={(e) => setEmailNotify(e.target.checked)}
            />
            Send email notification when processing is complete
          </label>
        </div>
      </Card>

      {/* Processing Options */}
      <Card header={<div className="font-semibold">Processing Options</div>}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-[12px] text-slate-500 mb-1">
              Default Service Type
            </div>
            <div className="relative">
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full appearance-none rounded-md border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm"
              >
                <option>Standard Delivery</option>
                <option>Jeddah Operations</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                ▾
              </span>
            </div>
          </div>
          <div>
            <div className="text-[12px] text-slate-500 mb-1">
              Default Priority
            </div>
            <div className="relative">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full appearance-none rounded-md border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm"
              >
                <option>Standard</option>
                <option>Express</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                ▾
              </span>
            </div>
          </div>
          <div>
            <div className="text-[12px] text-slate-500 mb-1">Batch Name</div>
            <Input
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
            />
          </div>
          <div>
            <div className="text-[12px] text-slate-500 mb-1">
              Processing Mode
            </div>
            <div className="relative">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full appearance-none rounded-md border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm"
              >
                <option>Process Immediately</option>
                <option>Save as Draft</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                ▾
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="secondary" disabled>
            Preview Data
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="gradient"
              onClick={startUpload}
              disabled={!canStart || uploading}
            >
              {uploading ? "Uploading..." : "Start Upload"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Recent Uploads */}
      {/* <Card header={<div className="font-semibold">Recent Uploads</div>}>
        <div className="space-y-2 text-sm">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <div>
                  <div className="font-medium text-slate-800">
                    batch_deliveries_jan_0{i}.csv
                  </div>
                  <div className="text-[12px] text-slate-500">
                    245 deliveries • Completed 2 hours ago
                  </div>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <XIcon size={16} />
              </button>
            </div>
          ))}
        </div>
      </Card> */}
    </div>
  );
}
