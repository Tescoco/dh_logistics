"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { SAUDI_CITIES } from "@/lib/cities";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { IMILE_CITIES } from "@/lib/imile_cities";
import { JNT_CITIES } from "@/lib/jnt_cities";
import { RGS_CITIES } from "@/lib/rgs_cities";

type DeliveryResponse = {
  delivery: {
    _id: string;
    reference: string;
    senderName?: string;
    senderPhone?: string;
    senderAddress?: string;
    senderCity?: string;
    senderDistrict?: string;
    senderPostalCode?: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    deliveryCity?: string;
    deliveryDistrict?: string;
    deliveryPostalCode?: string;
    weightKg?: number;
    dimensions?: string;
    packageType?: string;
    description: string;
    priority?: string;
    paymentMethod?: string;
    deliveryFee?: number;
    codAmount?: number;
    rtoAmount?: number;
    notes?: string;
    assignedDriverId?: { _id: string; firstName: string; lastName: string };
    serviceType?: string;
  };
};

export default function AdminEditDeliveryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<{
    reference: string;
    selectedClientId: string;
    senderName: string;
    senderPhone: string;
    senderAddress: string;
    senderCity: string;
    senderDistrict: string;
    senderPostalCode: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    deliveryCity: string;
    deliveryDistrict: string;
    deliveryPostalCode: string;
    weightKg: string;
    dimensions: string;
    packageType: string;
    description: string;
    priority: string;
    paymentMethod: string;
    deliveryFee: string;
    codAmount: string;
    rtoAmount: string;
    notes: string;
    assignedDriverId: string;
    serviceType: string;
  }>({
    reference: "",
    selectedClientId: "",
    senderName: "",
    senderPhone: "",
    senderAddress: "",
    senderCity: "",
    senderDistrict: "",
    senderPostalCode: "",
    customerName: "",
    customerPhone: "",
    deliveryAddress: "",
    deliveryCity: "",
    deliveryDistrict: "",
    deliveryPostalCode: "",
    weightKg: "",
    dimensions: "",
    packageType: "",
    description: "",
    priority: "standard",
    paymentMethod: "prepaid",
    deliveryFee: "",
    codAmount: "",
    rtoAmount: "",
    notes: "",
    assignedDriverId: "",
    serviceType: "",
  });

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const serviceCities = useMemo(() => {
    if (form.serviceType === "1") return RGS_CITIES;
    if (form.serviceType === "5") return JNT_CITIES;
    if (form.serviceType === "9") return IMILE_CITIES;
    return SAUDI_CITIES;
  }, [form.serviceType]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`/api/deliveries/${id}`);
        if (!r.ok) throw new Error("Failed");
        const data: DeliveryResponse = await r.json();
        if (!mounted) return;
        const d = data.delivery || {};
        setForm({
          reference: d.reference || "",
          selectedClientId: "", // Will be empty for editing existing deliveries
          senderName: d.senderName || "",
          senderPhone: d.senderPhone || "",
          senderAddress: d.senderAddress || "",
          senderCity: d.senderCity || "",
          senderDistrict: d.senderDistrict || "",
          senderPostalCode: d.senderPostalCode || "",
          customerName: d.customerName || "",
          customerPhone: d.customerPhone || "",
          deliveryAddress: d.deliveryAddress || "",
          deliveryCity: d.deliveryCity || "",
          deliveryDistrict: d.deliveryDistrict || "",
          deliveryPostalCode: d.deliveryPostalCode || "",
          weightKg: d.weightKg != null ? String(d.weightKg) : "",
          dimensions: d.dimensions || "",
          packageType: d.packageType || "",
          description: d.description || "",
          priority: d.priority || "standard",
          paymentMethod: d.paymentMethod || "prepaid",
          deliveryFee: d.deliveryFee != null ? String(d.deliveryFee) : "",
          codAmount: d.codAmount != null ? String(d.codAmount) : "",
          rtoAmount: d.rtoAmount != null ? String(d.rtoAmount) : "",
          notes: d.notes || "",
          assignedDriverId: d.assignedDriverId?._id || "",
          serviceType: d.serviceType || "1",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  async function submit() {
    setSaving(true);
    try {
      const payload = {
        senderName: form.senderName || undefined,
        senderPhone: form.senderPhone || undefined,
        senderAddress: form.senderAddress || undefined,
        senderCity: form.senderCity || undefined,
        senderDistrict: form.senderDistrict || undefined,
        senderPostalCode: form.senderPostalCode || undefined,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        deliveryAddress: form.deliveryAddress,
        deliveryCity: form.deliveryCity || undefined,
        deliveryDistrict: form.deliveryDistrict || undefined,
        deliveryPostalCode: form.deliveryPostalCode || undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        dimensions: form.dimensions || undefined,
        packageType: form.packageType || undefined,
        description: form.description || undefined,
        priority: form.priority,
        paymentMethod: form.paymentMethod,
        deliveryFee: form.deliveryFee ? Number(form.deliveryFee) : undefined,
        codAmount: form.codAmount ? Number(form.codAmount) : undefined,
        rtoAmount: form.rtoAmount ? Number(form.rtoAmount) : undefined,
        notes: form.notes || undefined,
      };
      const res = await fetch(`/api/deliveries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError("Update Failed", data?.error ?? "Failed to update delivery");
        return;
      }
      showSuccess("Updated", "Delivery updated successfully");
      router.push("/admin/deliveries");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Delivery</h1>
        <Link
          href="/admin/deliveries"
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          ← Back to Deliveries
        </Link>
      </div>

      <Card padded={false}>
        <div className="p-5 space-y-8">
          <section className="space-y-4 cl">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-[13px] text-slate-600">
                  Sender Name
                </label>
                <Input
                  value={form.senderName || ""}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Sender Phone
                </label>
                <Input
                  value={form.senderPhone || ""}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Select
                    value={form.serviceType}
                    onChange={(e) =>
                      update(
                        "serviceType",
                        (e.target as HTMLSelectElement).value
                      )
                    }
                    className="flex-1"
                  >
                    <option value="">Select Service Type</option>
                    <option value="1">Shipz Solutions</option>
                    <option value="5">JNT</option>
                    <option value="9">IMILE</option>
                  </Select>
                </div>
              </div>
            </div>
            <div>
              <label className="text-[13px] text-slate-600">
                Sender Address
              </label>
              <Input
                placeholder="2929, Unit (D), Rayhanah Bint Zaid, 8118"
                value={form.senderAddress || ""}
                onChange={(e) => update("senderAddress", e.target.value)}
              />
            </div>
            <div>
              <label className="text-[13px] text-slate-600">Sender City</label>
              <Select
                value={form.senderCity || ""}
                onChange={(e) => {
                  const city = (e.target as HTMLSelectElement).value;
                  update("senderCity", city);
                  // Reset district when city changes
                  update("senderDistrict", "");
                }}
              >
                <option value="">Select City</option>
                {SAUDI_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            {/* <div>
              <label className="text-[13px] text-slate-600">
                Sender District
              </label>
              <Select
                value={form.senderDistrict || ""}
                onChange={(e) =>
                  update(
                    "senderDistrict",
                    (e.target as HTMLSelectElement).value
                  )
                }
              >
                <option value="">Select District</option>
                {getDistrictsForCity(form.senderCity).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div> */}
          </section>

          <section className="space-y-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Receiver Information
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">
                  Receiver Name
                </label>
                <Input
                  value={form.customerName}
                  onChange={(e) => update("customerName", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Receiver Phone
                </label>
                <div className="flex">
                  <div className="flex items-center px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm text-gray-600">
                    +966
                  </div>
                  <Input
                    placeholder="5XXXXXXXX"
                    type="tel"
                    maxLength={9}
                    value={form.customerPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 9) {
                        update("customerPhone", value);
                      }
                    }}
                    className="rounded-l-none"
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Enter 9 digits only (without country code)
                </div>
              </div>
            </div>
            <div>
              <label className="text-[13px] text-slate-600">Address</label>
              <Input
                value={form.deliveryAddress}
                onChange={(e) => update("deliveryAddress", e.target.value)}
              />
            </div>
            <div>
              <label className="text-[13px] text-slate-600">City</label>
              <Select
                value={form.deliveryCity}
                onChange={(e) => {
                  const city = (e.target as HTMLSelectElement).value;
                  update("deliveryCity", city);
                  // Reset district when city changes
                  update("deliveryDistrict", "");
                }}
              >
                <option value="">Select City</option>
                {serviceCities.map((c, i) => (
                  <option key={i} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            {/* <div>
              <label className="text-[13px] text-slate-600">District</label>
              <Select
                value={form.deliveryDistrict || ""}
                onChange={(e) =>
                  update(
                    "deliveryDistrict",
                    (e.target as HTMLSelectElement).value
                  )
                }
              >
                <option value="">Select District</option>
                {getDistrictsForCity(form.deliveryCity).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div> */}
          </section>

          <section className="space-y-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Package & Options
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-[13px] text-slate-600">
                  Weight (kg)
                </label>
                <Input
                  placeholder="1.5"
                  value={form.weightKg}
                  onChange={(e) => update("weightKg", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">Dimensions</label>
                <Input
                  value={form.dimensions}
                  onChange={(e) => update("dimensions", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Package Type
                </label>
                <Select
                  value={form.packageType}
                  onChange={(e) =>
                    update("packageType", (e.target as HTMLSelectElement).value)
                  }
                >
                  <option value="">Select Type</option>
                  <option value="Parcel">Parcel</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-[13px] text-slate-600">Description</label>
              <Input
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">Priority</label>
                <Select
                  value={form.priority}
                  onChange={(e) =>
                    update("priority", (e.target as HTMLSelectElement).value)
                  }
                >
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                </Select>
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Payment Method
                </label>
                <Select
                  value={form.paymentMethod}
                  onChange={(e) =>
                    update(
                      "paymentMethod",
                      (e.target as HTMLSelectElement).value
                    )
                  }
                >
                  <option value="prepaid">Prepaid</option>
                  <option value="cod">Cash on Delivery</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">
                  Delivery Fee (﷼)
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.deliveryFee || ""}
                  onChange={(e) => update("deliveryFee", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  COD Amount (﷼)
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.codAmount}
                  onChange={(e) => update("codAmount", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">
                  RTO Amount (﷼)
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.rtoAmount}
                  onChange={(e) => update("rtoAmount", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Total Amount (﷼)
                </label>
                <Input
                  readOnly
                  value={(
                    Number(form.deliveryFee || 0) +
                    Number(form.codAmount || 0) +
                    Number(form.rtoAmount || 0)
                  ).toFixed(2)}
                  className="bg-gray-50"
                />
              </div>
            </div>
            <div>
              <label className="text-[13px] text-slate-600">Notes</label>
              <Input
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>
          </section>

          {/* <section className="space-y-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Activity Log
            </h2>
            {loadingActivity ? (
              <div className="text-sm text-slate-500">Loading activity...</div>
            ) : activityLog.length === 0 ? (
              <div className="text-sm text-slate-500">No activity recorded</div>
            ) : (
              <div className="space-y-3">
                {activityLog.map((entry, index) => (
                  <div
                    key={index}
                    className="flex gap-3 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-900">
                          {entry.performedBy.firstName}{" "}
                          {entry.performedBy.lastName}
                        </span>
                        <span className="text-slate-500">
                          ({entry.performedBy.role})
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">
                          {new Date(entry.performedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-slate-700 mt-1">
                        {entry.action === "assigned_to_courier" &&
                          "Assigned parcel to courier"}
                        {entry.action === "status_changed" &&
                          "Changed delivery status"}
                        {entry.action === "details_updated" &&
                          "Updated delivery details"}
                        {entry.action === "created" && "Created delivery"}
                        {![
                          "assigned_to_courier",
                          "status_changed",
                          "details_updated",
                          "created",
                        ].includes(entry.action) && entry.action}
                      </div>
                      {entry.details && (
                        <div className="text-sm text-slate-600 mt-1">
                          {entry.details}
                        </div>
                      )}
                      {entry.oldValue && entry.newValue && (
                        <div className="text-xs text-slate-500 mt-1">
                          Changed from "{entry.oldValue}" to "{entry.newValue}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section> */}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <Button variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button variant="gradient" onClick={submit} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
