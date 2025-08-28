"use client";

import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import {
  SearchIcon,
  DownloadIcon,
  EditIcon,
  UploadIcon,
} from "@/components/icons";
import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "@/contexts/ToastContext";

type CODDelivery = {
  _id: string;
  reference: string;
  customerName: string;
  customerStoreName?: string;
  customerPhone: string;
  deliveryAddress: string;
  codAmount: number;
  codPaymentStatus: "pending" | "paid" | "partial";
  codPaidAmount?: number;
  codPaidDate?: string;
  codNotes?: string;
  deliveryFee: number;
  rtoAmount?: number;
  status: string;
  createdAt: string;
  assignedDriver?: string;
};

type Client = {
  _id: string;
  firstName?: string;
  lastName?: string;
  customerStoreName?: string;
  email: string;
};

export default function AdminCODReportsPage() {
  const { showError, showSuccess } = useToast();

  // Date range - default to last 30 days
  const [fromDate, setFromDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  const [selectedClient, setSelectedClient] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [deliveries, setDeliveries] = useState<CODDelivery[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  // Summary stats
  const [summary, setSummary] = useState({
    totalAmount: 0,
    deliveries: 0,
    pendingAmount: 0,
    paidAmount: 0,
    deliveryFee: 0,
  });

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<CODDelivery | null>(
    null
  );
  const [editPaymentStatus, setEditPaymentStatus] = useState<
    "pending" | "paid" | "partial"
  >("pending");
  const [editPaidAmount, setEditPaidAmount] = useState("");
  const [editPaidDate, setEditPaidDate] = useState("");
  const [editRtoFee, setEditRtoFee] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  // Upload to client portal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load clients
  useEffect(() => {
    fetch("/api/users/clients")
      .then((r) => r.json())
      .then((d) => setClients(d.users || []))
      .catch(() => {});
  }, []);

  // Load deliveries when filters change
  useEffect(() => {
    if (!fromDate || !toDate) return;

    setLoading(true);
    const url = new URL("/api/cod", window.location.origin);
    url.searchParams.set("from", fromDate);
    url.searchParams.set("to", toDate);
    url.searchParams.set("detailed", "true");
    if (selectedClient) url.searchParams.set("client", selectedClient);

    fetch(url.toString())
      .then((r) => r.json())
      .then((data) => {
        setDeliveries(data.deliveries || []);

        // Calculate summary
        const deliveriesData = data.deliveries || [];
        const totalAmount = deliveriesData.reduce(
          (sum: number, d: CODDelivery) => sum + (d.codAmount || 0),
          0
        );
        const pendingAmount = deliveriesData
          .filter((d: CODDelivery) => d.codPaymentStatus === "pending")
          .reduce((sum: number, d: CODDelivery) => sum + (d.codAmount || 0), 0);
        const paidAmount = deliveriesData
          .filter((d: CODDelivery) => d.codPaymentStatus === "paid")
          .reduce(
            (sum: number, d: CODDelivery) =>
              sum + (d.codPaidAmount || d.codAmount || 0),
            0
          );
        const deliveryFee = deliveriesData.reduce(
          (sum: number, d: CODDelivery) => sum + (d.deliveryFee || 0),
          0
        );

        setSummary({
          totalAmount,
          deliveries: deliveriesData.length,
          pendingAmount,
          paidAmount,
          deliveryFee,
        });
      })
      .catch(() => showError("Error", "Failed to load COD deliveries"))
      .finally(() => setLoading(false));
  }, [fromDate, toDate, selectedClient, showError]);

  const filteredDeliveries = useMemo(() => {
    let filtered = deliveries;

    if (paymentStatusFilter) {
      filtered = filtered.filter(
        (d) => d.codPaymentStatus === paymentStatusFilter
      );
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((d) =>
        [
          d.reference,
          d.customerName,
          d.customerStoreName,
          d.customerPhone,
          d.deliveryAddress,
        ].some((field) => (field || "").toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [deliveries, paymentStatusFilter, search]);

  function openEditModal(delivery: CODDelivery) {
    setEditingDelivery(delivery);
    setEditPaymentStatus(delivery.codPaymentStatus);
    setEditPaidAmount(String(delivery.codAmount || 0));
    setEditPaidDate(new Date().toISOString().split("T")[0]);
    setEditRtoFee(String(delivery.rtoAmount || 0));
    setEditNotes(delivery.codNotes || "");
    setEditModalOpen(true);
  }

  async function handleUpdatePaymentStatus() {
    if (!editingDelivery) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/deliveries/${editingDelivery._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codPaymentStatus: editPaymentStatus,
          codPaidAmount: editPaidAmount ? Number(editPaidAmount) : undefined,
          codPaidDate: editPaidDate
            ? new Date(editPaidDate).toISOString()
            : undefined,
          rtoAmount: editRtoFee ? Number(editRtoFee) : undefined,
          codNotes: editNotes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError(
          "Update Failed",
          data?.error || "Failed to update payment status"
        );
        return;
      }

      // Update local state
      setDeliveries((prev) =>
        prev.map((d) =>
          d._id === editingDelivery._id
            ? {
                ...d,
                codPaymentStatus: editPaymentStatus,
                codPaidAmount: editPaidAmount
                  ? Number(editPaidAmount)
                  : undefined,
                codPaidDate: editPaidDate,
                rtoAmount: editRtoFee ? Number(editRtoFee) : undefined,
                codNotes: editNotes,
              }
            : d
        )
      );

      showSuccess("Updated", "Payment status updated successfully");
      setEditModalOpen(false);

      // Refresh summary by reloading data
      const url = new URL("/api/cod", window.location.origin);
      url.searchParams.set("from", fromDate);
      url.searchParams.set("to", toDate);
      url.searchParams.set("detailed", "true");
      if (selectedClient) url.searchParams.set("client", selectedClient);

      fetch(url.toString())
        .then((r) => r.json())
        .then((data) => {
          const deliveriesData = data.deliveries || [];
          const totalAmount = deliveriesData.reduce(
            (sum: number, d: CODDelivery) => sum + (d.codAmount || 0),
            0
          );
          const pendingAmount = deliveriesData
            .filter((d: CODDelivery) => d.codPaymentStatus === "pending")
            .reduce(
              (sum: number, d: CODDelivery) => sum + (d.codAmount || 0),
              0
            );
          const paidAmount = deliveriesData
            .filter((d: CODDelivery) => d.codPaymentStatus === "paid")
            .reduce(
              (sum: number, d: CODDelivery) =>
                sum + (d.codPaidAmount || d.codAmount || 0),
              0
            );
          const deliveryFee = deliveriesData.reduce(
            (sum: number, d: CODDelivery) => sum + (d.deliveryFee || 0),
            0
          );

          setSummary({
            totalAmount,
            deliveries: deliveriesData.length,
            pendingAmount,
            paidAmount,
            deliveryFee,
          });
        })
        .catch(() => {});
    } catch {
      showError("Update Failed", "Failed to update payment status");
    } finally {
      setUpdating(false);
    }
  }

  function downloadReport(format: "csv" | "excel" | "pdf") {
    // Create a temporary form to submit filtered data
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/cod/download";
    form.target = "_blank";

    // Add the filtered delivery IDs
    const deliveryIdsInput = document.createElement("input");
    deliveryIdsInput.type = "hidden";
    deliveryIdsInput.name = "deliveryIds";
    deliveryIdsInput.value = JSON.stringify(
      filteredDeliveries.map((d) => d._id)
    );
    form.appendChild(deliveryIdsInput);

    // Add format
    const formatInput = document.createElement("input");
    formatInput.type = "hidden";
    formatInput.name = "format";
    formatInput.value = format;
    form.appendChild(formatInput);

    // Add date range
    const fromDateInput = document.createElement("input");
    fromDateInput.type = "hidden";
    fromDateInput.name = "fromDate";
    fromDateInput.value = fromDate;
    form.appendChild(fromDateInput);

    const toDateInput = document.createElement("input");
    toDateInput.type = "hidden";
    toDateInput.name = "toDate";
    toDateInput.value = toDate;
    form.appendChild(toDateInput);

    // Add client filter
    if (selectedClient) {
      const clientInput = document.createElement("input");
      clientInput.type = "hidden";
      clientInput.name = "client";
      clientInput.value = selectedClient;
      form.appendChild(clientInput);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

  async function handleUploadToClientPortal() {
    setUploading(true);
    try {
      const res = await fetch("/api/cod/upload-to-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromDate,
          to: toDate,
          client: selectedClient,
          deliveries: filteredDeliveries.map((d) => d._id),
          // Include search and payment status filters
          search: search,
          paymentStatusFilter: paymentStatusFilter,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError(
          "Upload Failed",
          data?.error || "Failed to upload to client portal"
        );
        return;
      }

      showSuccess(
        "Success",
        "COD report uploaded to client portal successfully"
      );
      setUploadModalOpen(false);
    } catch {
      showError("Upload Failed", "Failed to upload to client portal");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">COD Reports Management</h1>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => downloadReport("csv")}
            leftIcon={<DownloadIcon size={18} />}
          >
            Download CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => downloadReport("excel")}
            leftIcon={<DownloadIcon size={18} />}
          >
            Download Excel
          </Button>
          <Button
            variant="secondary"
            onClick={() => downloadReport("pdf")}
            leftIcon={<DownloadIcon size={18} />}
          >
            Download PDF
          </Button>
          <Button
            onClick={() => setUploadModalOpen(true)}
            leftIcon={<UploadIcon size={18} />}
            disabled={filteredDeliveries.length === 0}
          >
            Upload to Client Portal
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
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
          <div>
            <label className="text-[13px] text-slate-600 mb-2 block">
              Store Name
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
              Payment Status
            </label>
            <Select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
            </Select>
          </div>
          <div>
            <label className="text-[13px] text-slate-600 mb-2 block">
              Search
            </label>
            <Input
              leftIcon={<SearchIcon size={16} />}
              placeholder="Search deliveries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card>
          <div className="text-[13px] text-slate-500">Total COD Amount</div>
          <div className="mt-2 text-2xl font-semibold">
            ﷼{summary.totalAmount.toFixed(2)}
          </div>
        </Card>
        <Card>
          <div className="text-[13px] text-slate-500">Total Deliveries</div>
          <div className="mt-2 text-2xl font-semibold">
            {summary.deliveries}
          </div>
        </Card>
        <Card>
          <div className="text-[13px] text-slate-500">Pending Amount</div>
          <div className="mt-2 text-2xl font-semibold text-amber-600">
            ﷼{summary.pendingAmount.toFixed(2)}
          </div>
        </Card>
        <Card>
          <div className="text-[13px] text-slate-500">Paid Amount</div>
          <div className="mt-2 text-2xl font-semibold text-green-600">
            ﷼{summary.paidAmount.toFixed(2)}
          </div>
        </Card>
        <Card>
          <div className="text-[13px] text-slate-500">Delivery Fee</div>
          <div className="mt-2 text-2xl font-semibold text-blue-600">
            ﷼{summary.deliveryFee.toFixed(2)}
          </div>
        </Card>
      </div>

      {/* Deliveries Table */}
      <Card
        header={<div className="font-semibold">COD Deliveries</div>}
        padded={false}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-[13px] text-slate-500">
                {[
                  "Reference",
                  "Customer",
                  "Store Name",
                  "COD Amount",
                  "Payment Status",
                  "Paid Amount",
                  "Paid Date",
                  "Status",
                  "Actions",
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
                    colSpan={9}
                    className="px-5 py-8 text-center text-slate-500"
                  >
                    Loading deliveries...
                  </td>
                </tr>
              ) : filteredDeliveries.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-8 text-center text-slate-500"
                  >
                    No COD deliveries found for the selected criteria
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery) => (
                  <tr key={delivery._id} className="border-t border-slate-100">
                    <td className="px-5 py-3">{delivery.reference}</td>
                    <td className="px-5 py-3">{delivery.customerName}</td>
                    <td className="px-5 py-3">
                      {delivery.customerStoreName || "—"}
                    </td>
                    <td className="px-5 py-3">
                      ﷼{(delivery.codAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-inset capitalize ${
                          delivery.codPaymentStatus === "paid"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : delivery.codPaymentStatus === "partial"
                            ? "bg-blue-50 text-blue-700 ring-blue-200"
                            : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                      >
                        {delivery.codPaymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {delivery.codPaidAmount
                        ? `﷼${delivery.codPaidAmount.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {delivery.codPaidDate
                        ? new Date(delivery.codPaidDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className="capitalize">
                        {delivery.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => openEditModal(delivery)}
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <EditIcon size={14} />
                        Edit Payment
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Payment Status Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Update COD Payment Status"
        widthClassName="max-w-2xl"
      >
        {editingDelivery && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="text-[12px] text-slate-500">Reference</div>
                <div className="font-medium uppercase">
                  {editingDelivery.reference}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Customer</div>
                <div className="font-medium">
                  {editingDelivery.customerName}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Store Name</div>
                <div className="font-medium">
                  {editingDelivery.customerStoreName || "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">COD Amount</div>
                <div className="font-medium">
                  ﷼{(editingDelivery.codAmount || 0).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600 mb-2 block">
                  Payment Status
                </label>
                <Select
                  value={editPaymentStatus}
                  onChange={(e) =>
                    setEditPaymentStatus(e.target.value as "pending" | "paid")
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </Select>
              </div>
              <div>
                <label className="text-[13px] text-slate-600 mb-2 block">
                  Paid Amount
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Amount paid"
                  value={editPaidAmount}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600 mb-2 block">
                  Paid Date
                </label>
                <Input
                  type="date"
                  value={editPaidDate}
                  onChange={(e) => setEditPaidDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600 mb-2 block">
                  RTO Fee (﷼)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editRtoFee}
                  onChange={(e) => setEditRtoFee(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[13px] text-slate-600 mb-2 block">
                Notes
              </label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                rows={3}
                placeholder="Payment notes..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdatePaymentStatus} disabled={updating}>
                {updating ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload to Client Portal Modal */}
      <Modal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload COD Report to Client Portal"
        widthClassName="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This will upload the current filtered COD report to the client
            portal for review.
            {selectedClient &&
              clients.find((c) => c._id === selectedClient) && (
                <span className="block mt-2 font-medium">
                  Client:{" "}
                  {clients.find((c) => c._id === selectedClient)
                    ?.customerStoreName ||
                    `${
                      clients.find((c) => c._id === selectedClient)
                        ?.firstName || ""
                    } ${
                      clients.find((c) => c._id === selectedClient)?.lastName ||
                      ""
                    }`.trim() ||
                    clients.find((c) => c._id === selectedClient)?.email}
                </span>
              )}
          </p>
          <div className="text-sm">
            <div>
              Date Range: {new Date(fromDate).toLocaleDateString()} -{" "}
              {new Date(toDate).toLocaleDateString()}
            </div>
            <div>Total Deliveries: {filteredDeliveries.length}</div>
            <div>
              Total Amount: $
              {filteredDeliveries
                .reduce((sum, d) => sum + (d.codAmount || 0), 0)
                .toFixed(2)}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUploadToClientPortal} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload to Client Portal"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
