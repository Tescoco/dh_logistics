"use client";

import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import Switch from "@/components/ui/Switch";
import { PlusIcon, SearchIcon, EditIcon, TrashIcon } from "@/components/icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/contexts/ToastContext";

type CourierCompany = {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  courierCompanyName: string;
  courierContactEmail?: string;
  courierContactPhone?: string;
  courierServiceAreas?: string[];
  isActive: boolean;
  createdAt: string;
};

export default function CouriersPage() {
  const { showError, showSuccess } = useToast();
  const [couriers, setCouriers] = useState<CourierCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  // Add/Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState<CourierCompany | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    courierCompanyName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    courierContactEmail: "",
    courierContactPhone: "",
    courierServiceAreas: [] as string[],
    address: "",
    city: "",
    district: "",
    postalCode: "",
  });

  const [serviceAreaInput, setServiceAreaInput] = useState("");

  const loadCouriers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/couriers");
      if (res.ok) {
        const data = await res.json();
        setCouriers(data.couriers || []);
      } else {
        showError("Error", "Failed to load courier companies");
      }
    } catch {
      showError("Error", "Failed to load courier companies");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadCouriers();
  }, [loadCouriers]);

  const filteredCouriers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return couriers;
    return couriers.filter((c) =>
      [
        c.courierCompanyName,
        c.firstName,
        c.lastName,
        c.email,
        c.courierContactEmail,
        c.courierContactPhone,
        ...(c.courierServiceAreas || []),
      ].some((field) => (field || "").toLowerCase().includes(q))
    );
  }, [couriers, query]);

  function openAddModal() {
    setEditingCourier(null);
    setFormData({
      courierCompanyName: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      courierContactEmail: "",
      courierContactPhone: "",
      courierServiceAreas: [],
      address: "",
      city: "",
      district: "",
      postalCode: "",
    });
    setServiceAreaInput("");
    setModalOpen(true);
  }

  function openEditModal(courier: CourierCompany) {
    setEditingCourier(courier);
    setFormData({
      courierCompanyName: courier.courierCompanyName,
      firstName: courier.firstName,
      lastName: courier.lastName || "",
      email: courier.email,
      phone: courier.phone || "",
      courierContactEmail: courier.courierContactEmail || "",
      courierContactPhone: courier.courierContactPhone || "",
      courierServiceAreas: courier.courierServiceAreas || [],
      address: "",
      city: "",
      district: "",
      postalCode: "",
    });
    setServiceAreaInput("");
    setModalOpen(true);
  }

  function addServiceArea() {
    const area = serviceAreaInput.trim();
    if (area && !formData.courierServiceAreas.includes(area)) {
      setFormData((prev) => ({
        ...prev,
        courierServiceAreas: [...prev.courierServiceAreas, area],
      }));
      setServiceAreaInput("");
    }
  }

  function removeServiceArea(area: string) {
    setFormData((prev) => ({
      ...prev,
      courierServiceAreas: prev.courierServiceAreas.filter((a) => a !== area),
    }));
  }

  async function handleSubmit() {
    if (
      !formData.courierCompanyName ||
      !formData.firstName ||
      !formData.email
    ) {
      showError(
        "Validation Error",
        "Company name, contact name, and email are required"
      );
      return;
    }

    setSubmitting(true);
    try {
      const url = editingCourier
        ? `/api/users/${editingCourier._id}`
        : "/api/couriers";
      const method = editingCourier ? "PATCH" : "POST";

      const payload: Partial<typeof formData> = { ...formData };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        // Handle Zod validation errors
        if (data?.error?.fieldErrors || data?.error?.formErrors) {
          const fieldErrors = data.error.fieldErrors || {};
          const formErrors = data.error.formErrors || [];

          const errorMessages = [
            ...formErrors,
            ...Object.entries(fieldErrors).map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(", ")}`;
              }
              return `${field}: ${errors}`;
            }),
          ];

          showError(
            editingCourier ? "Validation Error" : "Validation Error",
            errorMessages.join(" • ")
          );
        } else {
          showError(
            editingCourier ? "Update Failed" : "Creation Failed",
            data?.error ||
              `Failed to ${
                editingCourier ? "update" : "create"
              } courier company`
          );
        }
        return;
      }

      showSuccess(
        editingCourier ? "Updated" : "Created",
        `Courier company ${editingCourier ? "updated" : "created"} successfully`
      );
      setModalOpen(false);
      loadCouriers();
    } catch {
      showError(
        editingCourier ? "Update Failed" : "Creation Failed",
        `Failed to ${editingCourier ? "update" : "create"} courier company`
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(courier: CourierCompany) {
    console.log(
      "Toggle clicked for courier:",
      courier._id,
      "Current status:",
      courier.isActive
    );
    try {
      const res = await fetch(`/api/users/${courier._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !courier.isActive }),
      });

      console.log("API response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.log("API error:", errorData);
        showError("Update Failed", "Failed to update courier status");
        return;
      }

      setCouriers((prev) =>
        prev.map((c) =>
          c._id === courier._id ? { ...c, isActive: !c.isActive } : c
        )
      );
      showSuccess(
        "Updated",
        `Courier company ${!courier.isActive ? "activated" : "deactivated"}`
      );
    } catch (error) {
      console.error("Toggle error:", error);
      showError("Update Failed", "Failed to update courier status");
    }
  }

  async function handleDeleteCourier(courier: CourierCompany) {
    if (
      !confirm(`Are you sure you want to delete ${courier.courierCompanyName}?`)
    )
      return;

    try {
      const res = await fetch(`/api/users/${courier._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        showError("Delete Failed", "Failed to delete courier company");
        return;
      }

      setCouriers((prev) => prev.filter((c) => c._id !== courier._id));
      showSuccess("Deleted", "Courier company deleted successfully");
    } catch {
      showError("Delete Failed", "Failed to delete courier company");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Courier Companies</h1>
        <Button onClick={openAddModal} leftIcon={<PlusIcon size={18} />}>
          Add Courier Company
        </Button>
      </div>

      <Card
        header={<div className="font-semibold">Courier Companies</div>}
        padded={false}
      >
        <div className="p-5 flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            className="w-full md:w-80"
            leftIcon={<SearchIcon size={16} />}
            placeholder="Search courier companies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-[13px] text-slate-500">
                {[
                  "Company Name",
                  "Contact Person",
                  "Email",
                  "Phone",
                  "Service Areas",
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
                    colSpan={7}
                    className="px-5 py-8 text-center text-slate-500"
                  >
                    Loading courier companies...
                  </td>
                </tr>
              ) : filteredCouriers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-slate-500"
                  >
                    No courier companies found
                  </td>
                </tr>
              ) : (
                filteredCouriers.map((courier) => (
                  <tr key={courier._id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-medium">
                      {courier.courierCompanyName}
                    </td>
                    <td className="px-5 py-3">
                      {courier.firstName} {courier.lastName}
                    </td>
                    <td className="px-5 py-3">{courier.email}</td>
                    <td className="px-5 py-3">{courier.phone || "—"}</td>
                    <td className="px-5 py-3">
                      {courier.courierServiceAreas &&
                      courier.courierServiceAreas.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {courier.courierServiceAreas
                            .slice(0, 3)
                            .map((area) => (
                              <span
                                key={area}
                                className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600"
                              >
                                {area}
                              </span>
                            ))}
                          {courier.courierServiceAreas.length > 3 && (
                            <span className="text-[11px] text-slate-500">
                              +{courier.courierServiceAreas.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Switch
                        checked={courier.isActive}
                        onCheckedChange={() => {
                          console.log(
                            "Switch clicked for:",
                            courier.courierCompanyName
                          );
                          handleToggleActive(courier);
                        }}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditModal(courier)}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <EditIcon size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCourier(courier)}
                          className="text-red-600 hover:underline flex items-center gap-1"
                        >
                          <TrashIcon size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCourier ? "Edit Courier Company" : "Add Courier Company"}
        widthClassName="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-[13px] text-slate-600 mb-2 block">
                Company Name *
              </label>
              <Input
                placeholder="Courier company name"
                value={formData.courierCompanyName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    courierCompanyName: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-[13px] text-slate-600 mb-2 block">
                Contact Email *
              </label>
              <Input
                type="email"
                placeholder="contact@courier.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-[13px] text-slate-600 mb-2 block">
                Contact First Name *
              </label>
              <Input
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-[13px] text-slate-600 mb-2 block">
                Contact Last Name
              </label>
              <Input
                placeholder="Last name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-[13px] text-slate-600 mb-2 block">
                Phone Number
              </label>
              <div className="flex">
                <div className="flex items-center px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm text-gray-600">
                  +966
                </div>
                <Input
                  placeholder="5XXXXXXXX"
                  type="tel"
                  maxLength={9}
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 9) {
                      setFormData((prev) => ({ ...prev, phone: value }));
                    }
                  }}
                  className="rounded-l-none"
                />
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Enter 9 digits only (without country code)
              </div>
            </div>
            <div>
              <label className="text-[13px] text-slate-600 mb-2 block">
                Alternative Contact Email
              </label>
              <Input
                type="email"
                placeholder="Alternative email"
                value={formData.courierContactEmail}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    courierContactEmail: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className="text-[13px] text-slate-600 mb-2 block">
              Service Areas
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add service area (e.g., Riyadh, Jeddah)"
                value={serviceAreaInput}
                onChange={(e) => setServiceAreaInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addServiceArea();
                  }
                }}
              />
              <Button
                variant="secondary"
                onClick={addServiceArea}
                disabled={!serviceAreaInput.trim()}
              >
                Add
              </Button>
            </div>
            {formData.courierServiceAreas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.courierServiceAreas.map((area) => (
                  <span
                    key={area}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-[12px] text-blue-700"
                  >
                    {area}
                    <button
                      type="button"
                      onClick={() => removeServiceArea(area)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? editingCourier
                  ? "Updating..."
                  : "Creating..."
                : editingCourier
                ? "Update Courier"
                : "Add Courier"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
