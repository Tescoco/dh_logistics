"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { SAUDI_CITIES } from "@/lib/cities";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusIcon } from "@/components/icons";
import { useToast } from "@/contexts/ToastContext";
import { RGS_CITIES } from "@/lib/rgs_cities";
import { JNT_CITIES } from "@/lib/jnt_cities";
import { IMILE_CITIES } from "@/lib/imile_cities";

export default function CreateDeliveryPage() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [loadingReference, setLoadingReference] = useState(true);
  const [referenceError, setReferenceError] = useState<string | null>(null);

  // Auto-generate reference number based on existing orders
  async function generateReference(): Promise<string> {
    try {
      setReferenceError(null);
      const res = await fetch("/api/deliveries/count?scope=user");
      if (!res.ok) {
        throw new Error("Failed to get delivery count");
      }
      const data = await res.json();
      const orderCount = data.count || 0;

      // Generate reference starting from 1000 + existing orders
      let nextReference = 1000 + orderCount + 1;
      let reference = `SS${nextReference}`;

      // Check if this reference already exists and increment if needed
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const checkRes = await fetch(
          `/api/deliveries/check-reference?reference=${reference}`
        );
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (!checkData.exists) {
            break; // Reference is unique
          }
        }
        // Reference exists, try next one
        nextReference++;
        reference = `SS${nextReference}`;
        attempts++;
      }

      return reference;
    } catch (error) {
      console.error("Error generating reference:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate reference";
      setReferenceError(errorMessage);
      // Fallback to timestamp-based reference
      const timestamp = Date.now();
      return `SS${timestamp}`;
    }
  }

  // Fetch user profile and auto-populate address fields
  async function fetchUserProfile() {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        const user = data.user || {};

        // Auto-populate address fields if they exist
        if (user.address || user.city || user.district) {
          setForm((prev) => ({
            ...prev,
            senderAddress: user.address || prev.senderAddress,
            senderCity: user.city || prev.senderCity,
            senderDistrict: user.district || prev.senderDistrict,
            senderPostalCode: user.postalCode || prev.senderPostalCode,
            senderName: user.firstName || prev.senderName,
            senderPhone: user.phone || prev.senderPhone,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }

  // Regenerate reference number
  async function regenerateReference() {
    setLoadingReference(true);
    setReferenceError(null);
    try {
      const ref = await generateReference();
      setForm((prev) => ({ ...prev, reference: ref }));
    } catch (error) {
      console.error("Error regenerating reference:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to regenerate reference";
      setReferenceError(errorMessage);
      // Fallback to timestamp-based reference on error
      const timestamp = Date.now();
      setForm((prev) => ({ ...prev, reference: `SS${timestamp}` }));
    } finally {
      setLoadingReference(false);
    }
  }

  const [form, setForm] = useState({
    reference: "",
    customerName: "",
    customerPhone: "",
    customerWhatsApp: "",
    deliveryAddress: "",
    deliveryCity: "",
    deliveryDistrict: "",
    serviceType: "1",
    weightKg: "",
    dimensions: "",
    packageType: "",
    description: "",
    codAmount: "",
    notes: "",
    senderAddress: "",
    senderCity: "",
    senderDistrict: "",
    senderPostalCode: "",
    senderName: "",
    senderPhone: "",
  });

  const serviceCities = useMemo(() => {
    if (form.serviceType === "1") return RGS_CITIES;
    if (form.serviceType === "5") return JNT_CITIES;
    if (form.serviceType === "9") return IMILE_CITIES;
    return SAUDI_CITIES;
  }, [form.serviceType]);

  // Initialize reference number on component mount
  useEffect(() => {
    const initialize = async () => {
      setLoadingReference(true);
      setReferenceError(null);
      try {
        const ref = await generateReference();
        setForm((prev) => ({ ...prev, reference: ref }));
      } catch (error) {
        console.error("Error initializing reference:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to initialize reference";
        setReferenceError(errorMessage);
        // Fallback to timestamp-based reference on error
        const timestamp = Date.now();
        setForm((prev) => ({ ...prev, reference: `SS${timestamp}` }));
      } finally {
        setLoadingReference(false);
      }
    };
    initialize();

    // Also fetch user profile for address auto-population
    fetchUserProfile();
  }, []);

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));

    // Reset district when city changes
    if (key === "deliveryCity") {
      setForm((f) => ({ ...f, deliveryDistrict: "" }));
    }
  }

  async function submit(isDraft: boolean) {
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
        reference: form.reference,
        customerName: form.customerName,
        customerPhone: `+966${form.customerPhone}`,
        customerWhatsApp: form.customerWhatsApp
          ? `+966${form.customerWhatsApp}`
          : undefined,
        deliveryAddress: form.deliveryAddress,
        deliveryCity: form.deliveryCity,
        deliveryDistrict: form.deliveryDistrict,
        senderAddress: form.senderAddress,
        senderCity: form.senderCity,
        senderDistrict: form.senderDistrict,
        senderPostalCode: form.senderPostalCode,
        senderName: form.senderName,
        senderPhone: form.senderPhone,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        dimensions: form.dimensions || undefined,
        packageType: form.packageType || undefined,
        description: form.description,
        priority: "standard" as const,
        paymentMethod: "cod" as const,
        assignedDriverId: "68992b3ad5eb3b93c40396dc",
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
        showError("Save Failed", data?.error ?? "Failed to save delivery");
        return;
      }

      showSuccess(
        "Delivery Created",
        isDraft
          ? "Delivery saved as draft successfully"
          : "Delivery created successfully"
      );

      // Generate next reference number for next delivery
      await regenerateReference();

      router.push("/client/track");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/client/delivery/bulk"
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <PlusIcon size={16} /> Bulk Add Deliveries
        </Link>
        <Link
          href="/client/track"
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          ← Back to Deliveries
        </Link>
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
                  Reference Number <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="SS1000"
                  value={form.reference}
                  disabled
                  onChange={(e) => update("reference", e.target.value)}
                  className="bg-gray-50"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  {loadingReference
                    ? "Loading reference..."
                    : "Auto-generated reference number"}
                </div>
                {referenceError && (
                  <div className="text-[11px] text-red-500 mt-1">
                    Warning: {referenceError} (using fallback reference)
                  </div>
                )}
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
                  Receiver Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Jane Smith"
                  value={form.customerName}
                  onChange={(e) => update("customerName", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Contact Number <span className="text-red-500">*</span>
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">
                  WhatsApp Number
                </label>
                <div className="flex">
                  <div className="flex items-center px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm text-gray-600">
                    +966
                  </div>
                  <Input
                    placeholder="5XXXXXXXX"
                    type="tel"
                    maxLength={9}
                    value={form.customerWhatsApp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 9) {
                        update("customerWhatsApp", value);
                      }
                    }}
                    className="rounded-l-none"
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Optional - Enter 9 digits only
                </div>
              </div>
            </div>
            <div>
              <label className="text-[13px] text-slate-600">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="2929, Unit (D), Rayhanah Bint Zaid, 8118"
                  value={form.deliveryAddress}
                  onChange={(e) => update("deliveryAddress", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <div>
                <label className="text-[13px] text-slate-600">
                  City <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Select
                    value={form.deliveryCity}
                    onChange={(e) =>
                      update(
                        "deliveryCity",
                        (e.target as HTMLSelectElement).value
                      )
                    }
                    className="flex-1"
                  >
                    <option value="">Select City</option>
                    {serviceCities.map((c, i) => (
                      <option key={i} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              {/* <div>
                <label className="text-[13px] text-slate-600">
                  District <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Select
                    value={form.deliveryDistrict}
                    onChange={(e) =>
                      update(
                        "deliveryDistrict",
                        (e.target as HTMLSelectElement).value
                      )
                    }
                    disabled={!form.deliveryCity}
                    className="flex-1"
                  >
                    <option value="">Select District</option>
                    {form.deliveryCity &&
                      getDistrictsForCity(form.deliveryCity).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                  </Select>
                </div>
              </div> */}
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
                  type="number"
                  step="0.1"
                  min="0"
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
                  <option value="doscument">Document</option>
                  <option value="parcel">Parcel</option>
                  <option value="other">Other</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-[13px] text-slate-600">
                Package Description <span className="text-red-500">*</span>
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
                <label className="text-[13px] text-slate-600">
                  Shipping Type
                </label>
                <Input
                  value="Standard Shipping"
                  disabled
                  className="bg-gray-50"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Standard shipping only
                </div>
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Payment Method
                </label>
                <Input
                  value="Cash on Delivery"
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
            <div>
              <label className="text-[13px] text-slate-600">
                COD Amount (﷼) <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
                value={form.codAmount}
                onChange={(e) => update("codAmount", e.target.value)}
              />
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
