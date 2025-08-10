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

export default function BulkDeliveriesUploadPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
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

  const canStart = useMemo(() => !!file, [file]);

  function downloadTemplate() {
    const headers = [
      "reference,customerName,customerPhone,deliveryAddress,packageType,description,priority,paymentMethod,deliveryFee,codAmount,notes",
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
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(d?.error ?? "Upload failed");
        return;
      }
      alert(`Processed ${d.processed}, Updated ${d.updated}`);
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
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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
          </div>
        </div>
      </Card>

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
          <Button variant="secondary">Preview Data</Button>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary">Save as Draft</Button>
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
      <Card header={<div className="font-semibold">Recent Uploads</div>}>
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
      </Card>
    </div>
  );
}
