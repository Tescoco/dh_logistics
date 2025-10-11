"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import SmartSelect from "@/components/ui/SmartSelect";
import { SAUDI_CITIES } from "@/lib/cities";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { IMILE_CITIES } from "@/lib/imile_cities";
import { JNT_CITIES } from "@/lib/jnt_cities";
import { RGS_CITIES } from "@/lib/rgs_cities";

type DeliveryResponse = {
  delivery: {
    _id: string;
    reference: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    deliveryCity?: string;
    deliveryDistrict?: string;
    deliveryPostalCode?: string;
    weightKg?: number;
    dimensions?: string;
    packageType?: string;
    description?: string;
    priority?: "standard" | "express";
    paymentMethod?: "prepaid" | "cod";
    codAmount?: number;
    notes?: string;
    serviceType?: string;
    status: string;
  };
};

export default function EditDeliveryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const deliveryId = params?.id as string;
  const { showError, showSuccess } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<string>("pending");
  const [form, setForm] = useState({
    reference: "",
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
    priority: "standard" as "standard" | "express",
    paymentMethod: "prepaid" as "prepaid" | "cod",
    codAmount: "",
    notes: "",
    serviceType: "",
  });

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/deliveries/${deliveryId}`);
        if (!res.ok) throw new Error("Failed to load delivery");
        const data: DeliveryResponse = await res.json();
        if (!mounted) return;
        const d = data.delivery;
        setDeliveryStatus(d.status);
        setForm({
          reference: d.reference,
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
          codAmount: d.codAmount != null ? String(d.codAmount) : "",
          notes: d.notes || "",
          serviceType: d.serviceType || "",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [deliveryId]);

  async function submit() {
    // Client-side validation
    const problems: string[] = [];
    if (!form.customerName || form.customerName.trim().length === 0) {
      problems.push("Receiver name is required");
    }
    if (!form.customerPhone || form.customerPhone.trim().length === 0) {
      problems.push("Receiver phone is required");
    }
    if (!form.customerPhone || form.customerPhone.trim().length !== 9) {
      problems.push(
        "Receiver phone must be exactly 9 digits (without country code)"
      );
    }
    if (!form.deliveryAddress || form.deliveryAddress.trim().length === 0) {
      problems.push("Delivery address is required");
    }
    if (!form.deliveryCity || form.deliveryCity.trim().length === 0) {
      problems.push("Delivery city is required");
    }
    if (!form.description || form.description.trim().length === 0) {
      problems.push("Package description is required");
    }
    if (!form.codAmount || form.codAmount.trim().length === 0) {
      problems.push("COD amount is required");
    }

    if (problems.length > 0) {
      showError("Validation Error", problems.join(" • "));
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
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
        codAmount: form.codAmount ? Number(form.codAmount) : undefined,
        notes: form.notes || undefined,
        serviceType: form.serviceType || undefined,
      };
      const res = await fetch(`/api/deliveries/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError("Update Failed", data?.error ?? "Failed to update delivery");
        return;
      }
      showSuccess("Delivery Updated", "Delivery updated successfully");
      router.push("/client/track");
    } finally {
      setSubmitting(false);
    }
  }

  const isFormDisabled = deliveryStatus !== "pending";

  const serviceCities = useMemo(() => {
    if (form.serviceType === "1") return RGS_CITIES;
    if (form.serviceType === "5") return JNT_CITIES;
    if (form.serviceType === "9") return IMILE_CITIES;
    return SAUDI_CITIES;
  }, [form.serviceType]);

  if (loading) {
    return <div className="p-6 text-slate-500">Loading delivery…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <a
          href="/client/track"
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          ← Back to Deliveries
        </a>
      </div>

      <Card padded={false}>
        <div className="p-5 space-y-8">
          <section className="space-y-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">
                  Reference Number
                </label>
                <Input
                  placeholder="SHIPZ-0000-ABC"
                  value={form.reference}
                  disabled
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Reference cannot be changed
                </div>
              </div>
            </div>
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
                  placeholder="Jane Smith"
                  value={form.customerName}
                  onChange={(e) => update("customerName", e.target.value)}
                  disabled={isFormDisabled}
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
                    disabled={isFormDisabled}
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
                placeholder="2929, Unit (D), Rayhanah Bint Zaid, 8118"
                value={form.deliveryAddress}
                onChange={(e) => update("deliveryAddress", e.target.value)}
                disabled={isFormDisabled}
              />
            </div>
            <SmartSelect
              label="City"
              options={serviceCities}
              value={form.deliveryCity}
              onChange={(city) => update("deliveryCity", city)}
              placeholder="Select City"
              disabled={isFormDisabled}
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Package Details
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-[13px] text-slate-600">
                  Weight (kg)
                </label>
                <Input
                  type="number"
                  placeholder="1.5"
                  value={form.weightKg}
                  onChange={(e) => update("weightKg", e.target.value)}
                  disabled={isFormDisabled}
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Dimensions (L×W×H)
                </label>
                <Input
                  placeholder="20×15×10 cm"
                  value={form.dimensions}
                  onChange={(e) => update("dimensions", e.target.value)}
                  disabled={isFormDisabled}
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Package Type
                </label>
                <Select
                  value={form.packageType.toLowerCase()}
                  onChange={(e) =>
                    update("packageType", (e.target as HTMLSelectElement).value)
                  }
                  disabled={isFormDisabled}
                >
                  <option value="">Select Type</option>
                  <option value="parcel">Parcel</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-[13px] text-slate-600">
                Package Description
              </label>
              <Input
                placeholder="Brief description of package contents"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                disabled={isFormDisabled}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Delivery Options
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">Priority</label>
                <Select
                  value={form.priority}
                  onChange={(e) =>
                    update(
                      "priority",
                      (e.target as HTMLSelectElement).value as "standard"
                    )
                  }
                  disabled={isFormDisabled}
                >
                  <option value="standard">Standard</option>
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
                      (e.target as HTMLSelectElement).value as "prepaid" | "cod"
                    )
                  }
                  disabled={isFormDisabled}
                >
                  <option value="cod">Cash on Delivery</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">
                  COD Amount (﷼)
                </label>
                <Input
                  placeholder="0.00"
                  value={form.codAmount}
                  onChange={(e) => update("codAmount", e.target.value)}
                  disabled={isFormDisabled}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-[15px] font-semibold text-slate-900">Notes</h2>
            <div>
              <label className="text-[13px] text-slate-600">
                Additional Notes
              </label>
              <Input
                placeholder="Any special delivery instructions or notes"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                disabled={isFormDisabled}
              />
            </div>
          </section>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <Button
            variant="secondary"
            onClick={() => router.push("/client/track")}
          >
            Cancel
          </Button>
          <Button
            disabled={submitting || isFormDisabled}
            variant="gradient"
            onClick={() => submit()}
          >
            {submitting ? "Saving..." : "Update Delivery"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
