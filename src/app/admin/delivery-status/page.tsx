"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import {
  UploadIcon,
  SearchIcon,
  DownloadIcon,
  EditIcon,
  PlusIcon,
} from "@/components/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import {
  parseFile,
  validateDeliveryRow,
  type ParsedRow,
} from "@/lib/fileParser";

export default function DeliveryStatusPage() {
  const { showError, showSuccess } = useToast();
  // Independent filters for bulk update vs list view
  const [bulkStatusFilter, setBulkStatusFilter] = useState<string>("pending");
  const [id, setId] = useState<string>("");
  const [listStatusFilter, setListStatusFilter] = useState<string>("");
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
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
  const fileRef = useRef<HTMLInputElement | null>(null);
  // Bulk upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  type PreviewRow = {
    index: number;
    row: ParsedRow;
    valid: boolean;
    reason?: string;
    values: string[];
  };
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Inline editing state
  const [editingRow, setEditingRow] = useState<PreviewRow | null>(null);
  const [editValues, setEditValues] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);

  // Note modal state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Handle row editing
  const handleEditRow = (row: PreviewRow) => {
    setEditingRow(row);
    setEditValues([...row.values]);
    setShowEditModal(true);
  };

  // Save edited row
  const handleSaveEdit = () => {
    if (!editingRow) return;

    // Create new row data from edited values
    const newRowData: ParsedRow = {};
    columns.forEach((header, index) => {
      newRowData[header] = editValues[index] || "";
    });

    // Validate the edited row
    const validation = validateDeliveryRow(newRowData, columns);

    // Update the row
    const updatedRows = previewRows.map((r) => {
      if (r.index === editingRow.index) {
        return {
          ...r,
          row: newRowData,
          valid: validation.isValid,
          reason: validation.reason || undefined,
          values: editValues,
        };
      }
      return r;
    });

    setPreviewRows(updatedRows);
    setShowEditModal(false);
    setEditingRow(null);
    setEditValues([]);

    if (validation.isValid) {
      showSuccess(
        "Row Updated",
        "Row has been successfully updated and is now valid."
      );
    } else {
      showError(
        "Validation Failed",
        `Row still has issues: ${validation.reason}`
      );
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingRow(null);
    setEditValues([]);
  };

  // Handle adding notes
  const handleAddNote = async () => {
    if (!viewRow || !noteInput.trim()) return;

    setAddingNote(true);
    try {
      const response = await fetch(`/api/deliveries/${viewRow._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: noteInput.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add note");
      }

      showSuccess("Note added successfully");
      setNoteInput("");
      setShowNoteModal(false);

      // Refresh the activity log to show the new note
      if (viewRow) {
        setLoadingActivity(true);
        try {
          const res = await fetch(`/api/deliveries/${viewRow._id}/activity`);
          if (res.ok) {
            const data = await res.json();
            setActivityLog(data.activityLog || []);
          }
        } catch (error) {
          console.error("Failed to fetch activity log:", error);
        } finally {
          setLoadingActivity(false);
        }
      }
    } catch (error) {
      showError("Failed to add note");
      console.error("Error adding note:", error);
    } finally {
      setAddingNote(false);
    }
  };

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
  }, [listStatusFilter, refreshKey]);

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
      setRefreshKey((k) => k + 1);
      showSuccess(
        "Status Updated",
        "Delivery status has been updated successfully"
      );
    } else {
      const data = await res.json().catch(() => ({}));
      showError("Update Failed", data?.error ?? "Failed to update");
    }
  }

  async function handleFileChange(f: File | null) {
    setUploadFile(f);
    setPreviewRows([]);
    setColumns([]);
    setParseError(null);
    if (!f) return;

    // Validate file type
    const fileName = f.name.toLowerCase();
    const fileType = f.type;
    const isCSV = fileType === "text/csv" || fileName.endsWith(".csv");
    const isXLSX =
      fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileName.endsWith(".xlsx");

    if (!isCSV && !isXLSX) {
      setParseError("Unsupported file type. Please upload a CSV or XLSX file.");
      return;
    }

    try {
      // Parse the file using the new parser
      const parseResult = await parseFile(f);
      const { rows: parsedRows, headers } = parseResult;

      setColumns(headers);

      if (parsedRows.length === 0) {
        setParseError("No data rows found in the file.");
        return;
      }

      // Validate each row
      const previewRows: PreviewRow[] = [];
      for (let i = 0; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        const validation = validateDeliveryRow(row, headers);

        // Convert row object to array of values for display
        const values = headers.map((header) => row[header]?.toString() || "");

        previewRows.push({
          index: i + 1,
          row,
          valid: validation.isValid,
          reason: validation.reason || undefined,
          values,
        });
      }

      setPreviewRows(previewRows);
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to parse file";
      setParseError(errorMessage);
    }
  }

  function downloadTemplate() {
    const headers = [
      "reference,customerName,customerPhone,senderName,senderPhone,senderAddress,senderCity,senderDistrict,senderPostalCode,deliveryAddress,deliveryCity,deliveryDistrict,deliveryPostalCode,packageType,description,priority,paymentMethod,codAmount,notes,deliveryFee",
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
    if (!uploadFile) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", uploadFile);
      const res = await fetch("/api/deliveries/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        showError("Upload Failed", error?.error ?? "Upload failed");
        return;
      }
      const result = await res.json();
      const fileType = uploadFile.name.toLowerCase().endsWith(".xlsx")
        ? "Excel"
        : "CSV";
      showSuccess(
        "Upload Complete",
        `${fileType} file has been uploaded successfully. ${
          result.message || ""
        }`
      );
      // Refresh the page data
      setRefreshKey((k) => k + 1);
      setUploadFile(null);
      setPreviewRows([]);
      setParseError(null);
    } finally {
      setUploading(false);
    }
  }

  const router = useRouter();

  return (
    <div className="space-y-6">
      <Button
        onClick={() => {
          router.push("/admin/deliveries/new");
        }}
        leftIcon={<PlusIcon size={18} />}
      >
        Add New Delivery
      </Button>
      <Card header={<div className="font-semibold">Bulk Delivery Upload</div>}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[13px] text-slate-600">
              Upload a CSV or XLSX file containing delivery information
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
            Drop your CSV or XLSX file here
          </div>
          <div className="text-[12px] text-slate-500">
            or click to browse and select
          </div>
          <div className="mt-4">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx"
              hidden
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
            <Button
              leftIcon={<UploadIcon size={16} />}
              onClick={() => fileRef.current?.click()}
            >
              Choose File
            </Button>
            {uploadFile && (
              <div className="mt-2 text-sm text-slate-600">
                Selected: {uploadFile.name}
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
                  !uploadFile || previewRows.every((r) => !r.valid) || uploading
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
                      <button
                        onClick={() => !r.valid && handleEditRow(r)}
                        disabled={r.valid}
                        className={
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium whitespace-nowrap transition-all duration-200 " +
                          (r.valid
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 cursor-default"
                            : "bg-rose-50 text-rose-700 ring-1 ring-rose-200 cursor-pointer hover:bg-rose-100 hover:ring-rose-300")
                        }
                        title={r.reason || undefined}
                      >
                        {r.valid ? (
                          "Valid"
                        ) : (
                          <>
                            Invalid
                            <EditIcon size={10} />
                          </>
                        )}
                      </button>
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
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="assigned">Assigned</option>
            <option value="returned">Returned</option>
            <option value="future_delivery">Future Delivery</option>
            <option value="lost_damaged">Lost & Damages</option>
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
            <option value="future_delivery">Future Delivery</option>
            <option value="lost_damaged">Lost & Damages</option>
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
                      className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset capitalize ${
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
                      {d.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {new Date(d.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-[#0EA5E9]">
                    <button
                      onClick={async () => {
                        setViewRow(d);
                        setActiveTab("details");
                        // Fetch activity log
                        setLoadingActivity(true);
                        try {
                          const res = await fetch(
                            `/api/deliveries/${d._id}/activity`
                          );
                          if (res.ok) {
                            const data = await res.json();
                            setActivityLog(data.activityLog || []);
                          }
                        } catch (error) {
                          console.error("Failed to fetch activity log:", error);
                        } finally {
                          setLoadingActivity(false);
                        }
                      }}
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
        onClose={() => {
          setViewRow(null);
          setActivityLog([]);
          setActiveTab("details");
        }}
        title="Delivery Details"
        widthClassName="max-w-4xl"
      >
        {viewRow && (
          <div>
            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-4">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "details"
                    ? "border-[#0EA5E9] text-[#0EA5E9]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                BRIEF
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "activity"
                    ? "border-[#0EA5E9] text-[#0EA5E9]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                HISTORY
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "details" && (
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
                  <span className="font-medium capitalize">
                    {viewRow.status.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Updated:</span>{" "}
                  <span className="font-medium">
                    {new Date(viewRow.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-slate-900">
                    Activity Log
                  </h3>
                  <div className="flex gap-2 text-sm">
                    <button
                      onClick={() => setShowNoteModal(true)}
                      className="text-[#0EA5E9] hover:underline"
                    >
                      ADD NOTE
                    </button>
                  </div>
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
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#0EA5E9]"></div>

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
                                : "bg-[#0EA5E9]"
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
                                <div className="text-slate-600">
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
        )}
      </Modal>

      {/* Edit Row Modal */}
      <Modal
        open={showEditModal}
        onClose={handleCancelEdit}
        title={`Edit Row ${editingRow?.index || ""}`}
      >
        {editingRow && (
          <div className="space-y-4">
            <div className="text-sm text-slate-600 mb-4">
              {editingRow.reason && (
                <div className="bg-rose-50 border border-rose-200 rounded-md p-3 mb-3">
                  <div className="font-medium text-rose-800">
                    Validation Error:
                  </div>
                  <div className="text-rose-700">{editingRow.reason}</div>
                </div>
              )}
              <p>
                Edit the values below to fix validation issues. Click Save when
                done.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {columns.map((header, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {header}
                  </label>
                  <Input
                    type={
                      header === "customerPhone" || header === "senderPhone"
                        ? "number"
                        : "text"
                    }
                    value={editValues[index] || ""}
                    onChange={(e) => {
                      const newValues = [...editValues];
                      newValues[index] = e.target.value;
                      setEditValues(newValues);

                      // Build full row data from all edited values
                      const newRowData: ParsedRow = {};
                      columns.forEach((col, idx) => {
                        newRowData[col] = newValues[idx] || "";
                      });

                      // Validate full row on each change
                      const validation = validateDeliveryRow(
                        newRowData,
                        columns
                      );

                      // Reflect current validation state live in the modal
                      setEditingRow((prev) =>
                        prev
                          ? {
                              ...prev,
                              row: newRowData,
                              values: newValues,
                              valid: validation.isValid,
                              reason: validation.reason || undefined,
                            }
                          : prev
                      );

                      // If the row becomes valid, save immediately without waiting for submit
                      if (validation.isValid && editingRow) {
                        const updatedRows = previewRows.map((r) => {
                          if (r.index === editingRow.index) {
                            return {
                              ...r,
                              row: newRowData,
                              valid: true,
                              reason: undefined,
                              values: newValues,
                            };
                          }
                          return r;
                        });

                        setPreviewRows(updatedRows);
                        setShowEditModal(false);
                        setEditingRow(null);
                        setEditValues([]);
                        showSuccess(
                          "Row Updated",
                          "Row has been successfully updated and is now valid."
                        );
                      }
                    }}
                    placeholder={`Enter ${header}`}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="secondary" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button variant="gradient" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Note Modal */}
      <Modal
        open={showNoteModal}
        onClose={() => {
          setShowNoteModal(false);
          setNoteInput("");
        }}
        title="Add Note"
      >
        <div className="space-y-4">
          <div className="text-sm text-slate-600">
            Add a note to this delivery. This will be recorded in the activity
            log.
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Note
            </label>
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Enter your note here..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="secondary"
              onClick={() => {
                setShowNoteModal(false);
                setNoteInput("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleAddNote}
              disabled={!noteInput.trim() || addingNote}
            >
              {addingNote ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
