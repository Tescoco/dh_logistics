"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type DeliveryResponse = {
  delivery: {
    _id: string;
    reference: string;
    senderName?: string;
    senderPhone?: string;
    senderAddress?: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    weightKg?: number;
    dimensions?: string;
    packageType?: string;
    description?: string;
    priority?: "standard" | "express";
    paymentMethod?: "prepaid" | "cod";
    codAmount?: number;
    notes?: string;
  };
};

export default function EditDeliveryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const deliveryId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    reference: "",
    senderName: "",
    senderPhone: "",
    senderAddress: "",
    customerName: "",
    customerPhone: "",
    deliveryAddress: "",
    weightKg: "",
    dimensions: "",
    packageType: "",
    description: "",
    priority: "standard" as "standard" | "express",
    paymentMethod: "prepaid" as "prepaid" | "cod",
    codAmount: "",
    notes: "",
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
        setForm({
          reference: d.reference,
          senderName: d.senderName || "",
          senderPhone: d.senderPhone || "",
          senderAddress: d.senderAddress || "",
          customerName: d.customerName || "",
          customerPhone: d.customerPhone || "",
          deliveryAddress: d.deliveryAddress || "",
          weightKg: d.weightKg != null ? String(d.weightKg) : "",
          dimensions: d.dimensions || "",
          packageType: d.packageType || "",
          description: d.description || "",
          priority: d.priority || "standard",
          paymentMethod: d.paymentMethod || "prepaid",
          codAmount: d.codAmount != null ? String(d.codAmount) : "",
          notes: d.notes || "",
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
    setSubmitting(true);
    try {
      const payload = {
        senderName: form.senderName || undefined,
        senderPhone: form.senderPhone || undefined,
        senderAddress: form.senderAddress || undefined,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        deliveryAddress: form.deliveryAddress,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        dimensions: form.dimensions || undefined,
        packageType: form.packageType || undefined,
        description: form.description || undefined,
        priority: form.priority,
        paymentMethod: form.paymentMethod,
        codAmount: form.codAmount ? Number(form.codAmount) : undefined,
        notes: form.notes || undefined,
      };
      const res = await fetch(`/api/deliveries/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? "Failed to update delivery");
        return;
      }
      router.push("/client/track");
    } finally {
      setSubmitting(false);
    }
  }

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
              Sender Information
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">
                  Sender Name
                </label>
                <Input
                  placeholder="John Doe"
                  value={form.senderName}
                  onChange={(e) => update("senderName", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Sender Phone
                </label>
                <Input
                  placeholder="+1 234 567 8900"
                  value={form.senderPhone}
                  onChange={(e) => update("senderPhone", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-[13px] text-slate-600">
                Sender Address
              </label>
              <Input
                placeholder="123 Main Street, City, State, ZIP"
                value={form.senderAddress}
                onChange={(e) => update("senderAddress", e.target.value)}
              />
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
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Receiver Phone
                </label>
                <Input
                  placeholder="+1 234 567 8901"
                  value={form.customerPhone}
                  onChange={(e) => update("customerPhone", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-[13px] text-slate-600">
                Delivery Address
              </label>
              <Input
                placeholder="456 Oak Avenue, City, State, ZIP"
                value={form.deliveryAddress}
                onChange={(e) => update("deliveryAddress", e.target.value)}
              />
            </div>
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
                  placeholder="1.5"
                  value={form.weightKg}
                  onChange={(e) => update("weightKg", e.target.value)}
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
                  <option value="Document">Document</option>
                  <option value="Parcel">Parcel</option>
                  <option value="Other">Other</option>
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
                      (e.target as HTMLSelectElement).value as
                        | "standard"
                        | "express"
                    )
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
                      (e.target as HTMLSelectElement).value as "prepaid" | "cod"
                    )
                  }
                >
                  <option value="cod">Cash on Delivery</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">
                  COD Amount (₹)
                </label>
                <Input
                  placeholder="0.00"
                  value={form.codAmount}
                  onChange={(e) => update("codAmount", e.target.value)}
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
            disabled={submitting}
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
