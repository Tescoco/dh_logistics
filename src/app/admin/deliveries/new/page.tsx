"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useState } from "react";
import { useRouter } from "next/navigation";

// metadata is set at a parent server component level

export default function CreateDeliveryPage() {
  const router = useRouter();
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
    priority: "standard",
    paymentMethod: "prepaid",
    deliveryFee: "",
    codAmount: "",
    notes: "",
  });

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(isDraft: boolean) {
    setSubmitting(true);
    try {
      const payload = {
        reference: form.reference || `REF-${Date.now()}`,
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
        priority: form.priority as "standard" | "express",
        paymentMethod: form.paymentMethod as "prepaid" | "cod",
        deliveryFee: form.deliveryFee ? Number(form.deliveryFee) : undefined,
        codAmount: form.codAmount ? Number(form.codAmount) : undefined,
        notes: form.notes || undefined,
        isDraft,
      };
      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? "Failed to save delivery");
        return;
      }
      router.push("/admin/deliveries");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create Delivery
          </h1>
        </div>
        <a
          href="/admin/deliveries"
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
                  placeholder="SHIPZ-2025-001"
                  value={form.reference}
                  onChange={(e) => update("reference", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Delivery Service
                </label>
                <Select>
                  <option>Select Service</option>
                  <option>COD</option>
                  <option>Jeddah Operations</option>
                </Select>
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
                  <option>Select Type</option>
                  <option>Document</option>
                  <option>Parcel</option>
                  <option>Other</option>
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
                  <option value="cod">COD</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">
                  Delivery Fee ($)
                </label>
                <Input
                  placeholder="25.00"
                  value={form.deliveryFee}
                  onChange={(e) => update("deliveryFee", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  COD Amount ($)
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
            <h2 className="text-[15px] font-semibold text-slate-900">
              Special Instructions
            </h2>
            <div className="grid gap-3">
              <label className="inline-flex items-center gap-2 text-[14px] text-slate-700">
                <input type="checkbox" className="h-4 w-4" /> Fragile - Handle
                with care
              </label>
              <label className="inline-flex items-center gap-2 text-[14px] text-slate-700">
                <input type="checkbox" className="h-4 w-4" /> Signature required
              </label>
              <label className="inline-flex items-center gap-2 text-[14px] text-slate-700">
                <input type="checkbox" className="h-4 w-4" /> Insurance required
              </label>
            </div>
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
            disabled={submitting}
            variant="secondary"
            onClick={() => submit(true)}
          >
            {submitting ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            disabled={submitting}
            variant="gradient"
            onClick={() => submit(false)}
          >
            {submitting ? "Submitting..." : "Create Delivery"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
