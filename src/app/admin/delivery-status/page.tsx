"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { UploadIcon, SearchIcon } from "@/components/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";

export default function DeliveryStatusPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
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

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const url = new URL("/api/deliveries", window.location.origin);
    if (statusFilter) url.searchParams.set("status", statusFilter);
    fetch(url.toString())
      .then((r) => r.json())
      .then((d) => mounted && setRows(d.deliveries ?? []))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [statusFilter]);

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
    const target = prompt("Enter comma-separated delivery IDs");
    const newStatus = statusFilter || "in_transit";
    if (!target) return;
    const ids = target
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
      // refresh
      setStatusFilter((s) => s);
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
      setStatusFilter((s) => s);
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data?.error ?? "Upload failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Delivery Status Management
        </h1>
        <p className="text-slate-500 text-sm">
          Upload CSV files or update delivery statuses
        </p>
      </div>

      <Card header={<div className="font-semibold">CSV Upload</div>}>
        <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50 p-8 text-center">
          <div className="text-slate-600">
            Drop your CSV file here or click to browse
          </div>
          <div className="mt-4">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            <Button
              leftIcon={<UploadIcon size={18} />}
              onClick={() => fileRef.current?.click()}
            >
              Choose File
            </Button>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="danger" onClick={() => fileRef.current?.click()}>
            Upload & Process
          </Button>
        </div>
      </Card>

      <Card header={<div className="font-semibold">Bulk Status Update</div>}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr_auto]">
          <Select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter((e.target as HTMLSelectElement).value)
            }
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="assigned">Assigned</option>
            <option value="returned">Returned</option>
          </Select>
          <Input placeholder="ID1, ID2, ID3..." />
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
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter((e.target as HTMLSelectElement).value)
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
