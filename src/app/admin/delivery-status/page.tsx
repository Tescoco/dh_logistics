"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import CitySelect from "@/components/ui/CitySelect";
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
import { RGS_CITIES } from "@/lib/rgs_cities";
import { JNT_CITIES } from "@/lib/jnt_cities";
import { IMILE_CITIES } from "@/lib/imile_cities";

export default function DeliveryStatusPage() {
  const { showError, showSuccess } = useToast();
  // Independent filters for bulk update vs list view
  const [bulkStatusFilter, setBulkStatusFilter] = useState<string>("pending");
  const [id, setId] = useState<string>("");
  const [listStatusFilter, setListStatusFilter] = useState<string>("");
  const [query, setQuery] = useState("");

  // Bulk search state
  const [bulkSearchIds, setBulkSearchIds] = useState<string>("");
  const [bulkSearchResults, setBulkSearchResults] = useState<
    Array<{
      id: string;
      reference: string;
      customerName: string;
      customerStoreName?: string;
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [rows, setRows] = useState<
    {
      _id: string;
      reference: string;
      customerName: string;
      customerStoreName?: string;
      deliveryAddress: string;
      status: string;
      updatedAt: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [viewRow, setViewRow] = useState<null | {
    _id: string;
    reference: string;
    customerName: string;
    customerStoreName?: string;
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

  // Ticket generation state
  const [selectedTicketType, setSelectedTicketType] = useState<string>("");
  const [generatingTickets, setGeneratingTickets] = useState(false);

  // Inline editing state
  const [editingRow, setEditingRow] = useState<PreviewRow | null>(null);
  const [editValues, setEditValues] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);

  // Note modal state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Client upload functionality state
  const [showUploadTypeModal, setShowUploadTypeModal] = useState(false);
  const [showClientSelectionModal, setShowClientSelectionModal] =
    useState(false);
  const [uploadType, setUploadType] = useState<"general" | "client">("general");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clients, setClients] = useState<
    Array<{
      _id: string;
      firstName: string;
      lastName: string;
      deliveryFee: number;
      address?: string;
      city?: string;
      district?: string;
      phone?: string;
      senderName?: string;
      senderPhone?: string;
      senderAddress?: string;
      senderCity?: string;
    }>
  >([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [isTemplateDownload, setIsTemplateDownload] = useState(false);

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
  }, [listStatusFilter, refreshKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r._id.slice(-8),
        r.customerName,
        r.customerStoreName,
        r.deliveryAddress,
        r.status,
        r.reference,
      ]
        .filter(Boolean)
        .some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [rows, query]);

  // Selection helper functions
  const allVisibleSelected = useMemo(
    () => filtered.length > 0 && filtered.every((d) => selectedIds.has(d._id)),
    [filtered, selectedIds]
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
      const ids = filtered.map((d) => d._id);
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

      // Update local state - mark assigned parcels as assigned
      setRows((prev) =>
        prev.map((r) =>
          selectedIds.has(r._id) ? { ...r, status: "assigned" } : r
        )
      );

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

  async function handleGenerateTickets() {
    if (!selectedTicketType || selectedIds.size === 0) return;

    setGeneratingTickets(true);
    try {
      const deliveryIds = Array.from(selectedIds).join(",");

      // For thermal tickets, redirect to the thermal tickets page
      if (selectedTicketType === "thermal") {
        router.push(`/admin/thermal-tickets?deliveryIds=${deliveryIds}`);
        return;
      }

      // For A4 tickets, redirect to the A4 tickets page
      if (selectedTicketType === "a4") {
        router.push(`/admin/a4-tickets?deliveryIds=${deliveryIds}`);
        return;
      }

      // For other ticket types, use the API (if any future types are added)
      const res = await fetch("/api/deliveries/generate-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryIds: Array.from(selectedIds),
          ticketType: selectedTicketType,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(
          "Ticket Generation Failed",
          data?.error ?? "Failed to generate tickets"
        );
        return;
      }

      showSuccess(
        "Tickets Generated",
        `Successfully generated ${selectedTicketType} tickets for ${
          selectedIds.size
        } parcel${selectedIds.size > 1 ? "s" : ""}`
      );

      setSelectedIds(new Set());
      setSelectedTicketType("");

      // Refresh data
      setRefreshKey((k) => k + 1);
    } catch {
      showError("Ticket Generation Failed", "Failed to generate tickets");
    } finally {
      setGeneratingTickets(false);
    }
  }

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

  // Load clients function
  async function loadClients() {
    setLoadingClients(true);
    try {
      const res = await fetch("/api/users/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data.users || []);
      } else {
        showError("Failed to load clients", "Could not fetch client list");
      }
    } catch (error) {
      console.error("Error loading clients:", error);
      showError("Failed to load clients", "Could not fetch client list");
    } finally {
      setLoadingClients(false);
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

  async function handleAllDeliveriesDownload(format: "csv" | "xls") {
    if (rows.length === 0) {
      showError("Download Failed", "No deliveries to download");
      return;
    }

    try {
      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          status: listStatusFilter || undefined,
          search: query || undefined,
        }),
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
      a.download = `all-deliveries-${
        new Date().toISOString().split("T")[0]
      }.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showSuccess(
        "Download Successful",
        `All deliveries downloaded successfully`
      );
    } catch {
      showError("Download Failed", "Failed to download file");
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

  async function downloadTemplate() {
    setIsTemplateDownload(true);
    setShowUploadTypeModal(true);
  }

  async function downloadGeneralTemplate() {
    // IMPORTANT: COD format issue - The system only accepts "cod" (lowercase)
    // and does NOT accept "COD" (uppercase) for the paymentMethod field.
    // This was discovered during testing where bulk uploads failed with uppercase COD values.

    // Download empty template
    const headers = [
      "reference,customerName,customerStoreName,customerPhone,senderName,senderPhone,senderAddress,senderCity,deliveryAddress,deliveryCity,packageType,description,priority,paymentMethod,codAmount,notes,deliveryFee,serviceType,customerWhatsApp",
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

    // Wait a moment before downloading the example file to avoid browser blocking
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Also download example template with sample data
    const exampleData = [
      "reference,customerName,customerStoreName,customerPhone,senderName,senderPhone,senderAddress,senderCity,deliveryAddress,deliveryCity,packageType,description,priority,paymentMethod,codAmount,notes,deliveryFee,serviceType,customerWhatsApp",
      "SS10001,Ahmed Al-Rashid,Tech Store,501234567,John Smith,502345678,123 Sender St,Riyadh,456 Customer Ave,Jeddah,parcel,Electronics package,standard,cod,150.00,Sample delivery,25.00,1,0599999999",
      "SS10002,Sarah Johnson,Fashion Hub,503456789,Mike Wilson,504567890,456 Sender Blvd,Dammam,789 Customer Rd,Abu Sidayrah,parcel,Clothing items,standard,cod,75.50,Handle with care,20.00,5,0599999999",
      "SS10003,Mohammed Ali,Book World,505678901,Lisa Brown,506789012,789 Sender Ave,Jeddah,123 Customer St,Mijannah,parcel,Books and documents,standard,cod,45.00,No signature required,15.00,9,0599999999",
    ].join("\n");

    const exampleBlob = new Blob([exampleData], {
      type: "text/csv;charset=utf-8;",
    });
    const exampleUrl = URL.createObjectURL(exampleBlob);
    const exampleLink = document.createElement("a");
    exampleLink.href = exampleUrl;
    exampleLink.download = "deliveries_example.csv";
    document.body.appendChild(exampleLink);
    exampleLink.click();
    document.body.removeChild(exampleLink);
    URL.revokeObjectURL(exampleUrl);

    // Show success message
    showSuccess(
      "Templates Downloaded",
      "Both empty template and example template have been downloaded successfully."
    );
  }

  async function downloadClientTemplate() {
    // Client template with minimal required fields
    const headers = [
      "reference,customerName,customerStoreName,customerPhone,deliveryAddress,deliveryCity,packageType,description,codAmount,notes,customerWhatsApp",
    ].join("\n");
    const blob = new Blob([headers], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "client_deliveries_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Wait a moment before downloading the example file
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Also download example template with sample data for client uploads
    const exampleData = [
      "reference,customerName,customerStoreName,customerPhone,deliveryAddress,deliveryCity,packageType,description,codAmount,notes,serviceType,customerWhatsApp",
      "CL10001,Ahmed Al-Rashid,Tech Store,501234567,456 Customer Ave,Jeddah,parcel,Electronics package,150.00,Sample delivery, 1,0599999999",
      "CL10002,Sarah Johnson,Fashion Hub,503456789,789 Customer Rd,Abu Sidayrah,parcel,Clothing items,75.50,Handle with care, 5,0599999999",
      "CL10003,Mohammed Ali,Book World,505678901,123 Customer St,Mijannah,parcel,Books and documents,45.00,No signature required, 9,0599999999",
    ].join("\n");

    const exampleBlob = new Blob([exampleData], {
      type: "text/csv;charset=utf-8;",
    });
    const exampleUrl = URL.createObjectURL(exampleBlob);
    const exampleLink = document.createElement("a");
    exampleLink.href = exampleUrl;
    exampleLink.download = "client_deliveries_example.csv";
    document.body.appendChild(exampleLink);
    exampleLink.click();
    document.body.removeChild(exampleLink);
    URL.revokeObjectURL(exampleUrl);

    // Show success message
    showSuccess(
      "Client Templates Downloaded",
      "Both empty client template and example client template have been downloaded successfully."
    );
  }

  async function startUpload() {
    if (!uploadFile || previewRows.length === 0) return;
    setUploading(true);
    try {
      // Instead of sending the original file, send the edited data
      const editedData = {
        headers: columns,
        rows: previewRows.map((row) => row.row), // Use the edited row data
        fileName: uploadFile.name,
        fileType: uploadFile.name.toLowerCase().endsWith(".xlsx")
          ? "xlsx"
          : "csv",
        // Add client upload specific data
        isClientUpload: uploadType === "client",
        clientId: uploadType === "client" ? selectedClientId : undefined,
      };

      const res = await fetch("/api/deliveries/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedData),
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
      setUploadType("general");
      setSelectedClientId("");
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
              Upload a CSV or XLSX file containing delivery information. Click
              &quot;Download Templates&quot; to get both empty and example
              templates.
            </div>
          </div>
          <Button
            variant="secondary"
            leftIcon={<DownloadIcon size={16} />}
            onClick={downloadTemplate}
          >
            Download Templates
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
              onClick={() => {
                setIsTemplateDownload(false);
                setShowUploadTypeModal(true);
              }}
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
            placeholder="Reference ID1, Reference ID2, Reference ID3..."
            value={id}
            onChange={(e) => setId((e.target as HTMLInputElement).value)}
          />
          <Button onClick={handleBulkUpdate}>Update Selected</Button>
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
                        Store Name
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
                        <td className="px-4 py-2 text-sm text-slate-700">
                          {delivery.customerStoreName || "—"}
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
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleAllDeliveriesDownload("csv")}
              variant="secondary"
              size="sm"
              leftIcon={<DownloadIcon size={16} />}
              disabled={rows.length === 0}
            >
              CSV
            </Button>
            <Button
              onClick={() => handleAllDeliveriesDownload("xls")}
              variant="secondary"
              size="sm"
              leftIcon={<DownloadIcon size={16} />}
              disabled={rows.length === 0}
            >
              XLS
            </Button>
          </div>
        </div>

        {/* Courier Assignment Section */}
        {selectedIds.size > 0 && (
          <div className="px-5 pb-5 border-t border-slate-100">
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

        {/* Ticket Generation Section */}
        {selectedIds.size > 0 && (
          <div className="px-5 pb-5 border-t border-slate-100">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="text-[13px] text-slate-500 whitespace-nowrap">
                Generate tickets for {selectedIds.size} parcel
                {selectedIds.size > 1 ? "s" : ""}
              </div>
              <Select
                className="w-full md:w-56"
                value={selectedTicketType}
                onChange={(e) =>
                  setSelectedTicketType((e.target as HTMLSelectElement).value)
                }
              >
                <option value="" disabled>
                  Select ticket type
                </option>
                <option value="thermal">Thermal Parcel Ticket</option>
                <option value="a4">A4 Parcel Ticket</option>
              </Select>
              <Button
                disabled={
                  !selectedTicketType ||
                  selectedIds.size === 0 ||
                  generatingTickets
                }
                onClick={handleGenerateTickets}
                className="w-full md:w-auto whitespace-nowrap"
              >
                {generatingTickets ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-[13px] text-slate-500">
                <th className="px-5 py-3 font-medium">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    aria-label="Select all visible"
                  />
                </th>
                {[
                  "Reference ID",
                  "Customer",
                  "Store Name",
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
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(d._id)}
                      onChange={() => toggleSelectOne(d._id)}
                      aria-label={`Select ${d._id}`}
                    />
                  </td>
                  <td className="px-5 py-3 uppercase">{d.reference}</td>
                  <td className="px-5 py-3">{d.customerName}</td>
                  <td className="px-5 py-3">{d.customerStoreName || "—"}</td>
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
                {viewRow.customerStoreName && (
                  <div>
                    <span className="text-slate-500">Store Name:</span>{" "}
                    <span className="font-medium">
                      {viewRow.customerStoreName}
                    </span>
                  </div>
                )}
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
                                {activity.performedBy?.firstName || ""}{" "}
                                {activity.performedBy?.lastName || ""}
                              </span>
                              {activity.performedBy?.role && (
                                <span className="text-slate-400">
                                  {" "}
                                  (Role: {activity.performedBy?.role || ""})
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
                  {header.toLowerCase().includes("servicetype") ||
                  header.toLowerCase().includes("service type") ? (
                    <select
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Service Type</option>
                      <option value="1">1 - Shipz Solutions</option>
                      <option value="5">5 - JNT</option>
                      <option value="9">9 - IMILE</option>
                    </select>
                  ) : header.toLowerCase().includes("deliverycity") ||
                    header.toLowerCase().includes("delivery city") ? (
                    <CitySelect
                      serviceType={(() => {
                        // Get the current service type from the row
                        const serviceTypeIndex = columns.findIndex(
                          (col) =>
                            col.toLowerCase().includes("servicetype") ||
                            col.toLowerCase().includes("service type")
                        );
                        return serviceTypeIndex >= 0
                          ? editValues[serviceTypeIndex] || ""
                          : "";
                      })()}
                      value={editValues[index] || ""}
                      onChange={(value) => {
                        const newValues = [...editValues];
                        newValues[index] = value;
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
                      className="w-full"
                    />
                  ) : (
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
                  )}
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

      {/* Upload Type Modal */}
      <Modal
        open={showUploadTypeModal}
        onClose={() => {
          setShowUploadTypeModal(false);
          setUploadType("general");
          setIsTemplateDownload(false);
        }}
        title={isTemplateDownload ? "Download Template" : "Upload Type"}
      >
        <div className="space-y-4">
          <div className="text-sm text-slate-600">
            {isTemplateDownload
              ? "Choose which type of template you want to download:"
              : "Choose the upload type:"}
          </div>

          <div className="space-y-3">
            <div
              onClick={() => setUploadType("general")}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                uploadType === "general"
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  checked={uploadType === "general"}
                  onChange={() => setUploadType("general")}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium text-slate-900">
                    General Upload
                  </div>
                  <div className="text-sm text-slate-600">
                    Upload deliveries with all sender information, payment
                    methods, and delivery fees
                  </div>
                </div>
              </div>
            </div>

            <div
              onClick={() => setUploadType("client")}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                uploadType === "client"
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  checked={uploadType === "client"}
                  onChange={() => setUploadType("client")}
                  className="text-blue-600"
                />
                <div>
                  <div className="font-medium text-slate-900">
                    Client Upload
                  </div>
                  <div className="text-sm text-slate-600">
                    Upload deliveries for a specific client. Sender info and
                    delivery fees will be populated automatically. Payment
                    method will be set to COD and priority to standard.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="secondary"
              onClick={() => {
                setShowUploadTypeModal(false);
                setUploadType("general");
                setIsTemplateDownload(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={() => {
                setShowUploadTypeModal(false);
                if (isTemplateDownload) {
                  // Handle template download
                  if (uploadType === "general") {
                    downloadGeneralTemplate();
                  } else {
                    downloadClientTemplate();
                  }
                  setIsTemplateDownload(false);
                } else {
                  // Handle file upload
                  if (uploadType === "client") {
                    loadClients();
                    setShowClientSelectionModal(true);
                  } else {
                    fileRef.current?.click();
                  }
                }
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>

      {/* Client Selection Modal */}
      <Modal
        open={showClientSelectionModal}
        onClose={() => {
          setShowClientSelectionModal(false);
          setSelectedClientId("");
          setUploadType("general");
        }}
        title="Select Client"
      >
        <div className="space-y-4">
          <div className="text-sm text-slate-600">
            Select the client for whom you want to upload deliveries:
          </div>

          {loadingClients ? (
            <div className="text-center py-8 text-slate-500">
              Loading clients...
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No clients found
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {clients.map((client) => (
                <div
                  key={client._id}
                  onClick={() => setSelectedClientId(client._id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedClientId === client._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked={selectedClientId === client._id}
                      onChange={() => setSelectedClientId(client._id)}
                      className="text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-slate-900">
                        {client.firstName} {client.lastName}
                      </div>
                      <div className="text-sm text-slate-600">
                        Fee: SAR {client.deliveryFee} • {client.phone}
                        {client.city && ` • ${client.city}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="secondary"
              onClick={() => {
                setShowClientSelectionModal(false);
                setSelectedClientId("");
                setUploadType("general");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              disabled={!selectedClientId}
              onClick={() => {
                setShowClientSelectionModal(false);
                // Trigger file selection
                fileRef.current?.click();
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
