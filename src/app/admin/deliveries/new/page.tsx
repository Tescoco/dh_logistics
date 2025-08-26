"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { SAUDI_CITIES } from "@/lib/cities";
import { getDistrictsForCity } from "@/lib/districts";
import { useEffect, useMemo, useState } from "react";
import { RGS_CITIES } from "@/lib/rgs_cities";
import { JNT_CITIES } from "@/lib/jnt_cities";
import { IMILE_CITIES } from "@/lib/imile_cities";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";

// metadata is set at a parent server component level

type ClientUser = {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  deliveryFee: number;
  address?: string;
  city?: string;
  district?: string;
  postalCode?: string;
};

export default function AdminNewDeliveryPage() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingReference, setLoadingReference] = useState(true);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const restrictedDriverId = "68992b3ad5eb3b93c40396dc";

  // Auto-generate reference number based on existing orders
  async function generateReference(): Promise<string> {
    try {
      setReferenceError(null);
      const res = await fetch("/api/deliveries/count?scope=all");
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
    priority: "standard" as "standard" | "express",
    paymentMethod: "prepaid" as "prepaid" | "cod",
    deliveryFee: "",
    codAmount: "",
    notes: "",
    assignedDriverId: "",
    serviceType: "1" as "1" | "5" | "9",
  });

  type Driver = {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    role: string;
    courierCompanyName?: string;
  };
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/users", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        const allUsers: Driver[] = data?.users ?? [];
        const onlyDrivers = allUsers.filter(
          (u) => u.role === "driver" || u.role === "courier"
        );
        if (!aborted) setDrivers(onlyDrivers);
      } catch {}
    })();
    return () => {
      aborted = true;
    };
  }, []);

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
  }, []);

  useEffect(() => {
    if (
      form.assignedDriverId === restrictedDriverId &&
      form.paymentMethod !== "cod"
    ) {
      setForm((f) => ({ ...f, paymentMethod: "cod" }));
    }
  }, [form.assignedDriverId, form.paymentMethod]);

  const serviceCities = useMemo(() => {
    if (form.serviceType === "1") return RGS_CITIES;
    if (form.serviceType === "5") return JNT_CITIES;
    if (form.serviceType === "9") return IMILE_CITIES;
    return SAUDI_CITIES;
  }, [form.serviceType]);

  useEffect(() => {
    if (form.senderCity && !serviceCities.includes(form.senderCity)) {
      setForm((f) => ({ ...f, senderCity: "", senderDistrict: "" }));
    }
    if (form.deliveryCity && !serviceCities.includes(form.deliveryCity)) {
      setForm((f) => ({ ...f, deliveryCity: "", deliveryDistrict: "" }));
    }
  }, [serviceCities]);

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/users/clients");
        if (res.ok) {
          const data = await res.json();
          setClients(data.users || []);
        } else {
          showError("Failed to load clients", "Could not fetch client list");
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        showError("Failed to load clients", "Could not fetch client list");
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, [showError]);

  // Handle client selection and auto-populate sender fields (name, phone, delivery fee, and address)
  function handleClientSelection(clientId: string) {
    const selectedClient = clients.find((c) => c._id === clientId);
    if (selectedClient) {
      setForm((prev) => ({
        ...prev,
        selectedClientId: clientId,
        senderName:
          `${selectedClient.firstName} ${selectedClient.lastName}`.trim(),
        senderPhone: selectedClient.phone || "",
        deliveryFee: String(selectedClient.deliveryFee || 0),
        // Auto-populate address fields from client
        senderAddress: selectedClient.address || "",
        senderCity: selectedClient.city || "",
        senderDistrict: selectedClient.district || "",
        senderPostalCode: selectedClient.postalCode || "",
      }));
    } else {
      // Clear only auto-populated fields if no client selected
      setForm((prev) => ({
        ...prev,
        selectedClientId: "",
        senderName: "",
        senderPhone: "",
        deliveryFee: "",
        // Clear address fields when no client selected
        senderAddress: "",
        senderCity: "",
        senderDistrict: "",
        senderPostalCode: "",
      }));
    }
  }

  // Clear client-related fields when switching to non-restricted driver
  useEffect(() => {
    if (form.assignedDriverId && form.assignedDriverId !== restrictedDriverId) {
      setForm((prev) => ({
        ...prev,
        selectedClientId: "",
        senderName: "",
        senderPhone: "",
        deliveryFee: "",
        senderAddress: "",
        senderCity: "",
        senderDistrict: "",
        senderPostalCode: "",
      }));
    }
  }, [form.assignedDriverId]);

  function normalizePhone(value: string) {
    return (value || "").replace(/\D/g, "");
  }

  function normalizeText(value: string) {
    return (value || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  async function submit(isDraft: boolean) {
    // Client-side validation
    const problems: string[] = [];
    if (!form.assignedDriverId) {
      problems.push("Driver is required");
    }
    if (!form.description || form.description.trim().length < 5) {
      problems.push("Description must be at least 5 characters");
    }
    if (!form.customerPhone || form.customerPhone.trim().length !== 9) {
      problems.push(
        "Receiver phone must be exactly 9 digits (without country code)"
      );
    }
    if (!form.senderPhone || form.senderPhone.trim().length !== 9) {
      problems.push(
        "Sender phone must be exactly 9 digits (without country code)"
      );
    }
    if (
      form.paymentMethod === "cod" &&
      (form.codAmount === "" || String(form.codAmount).trim().length === 0)
    ) {
      problems.push("COD amount is required when payment method is COD");
    }
    const senderPhoneNorm = normalizePhone(form.senderPhone);
    const receiverPhoneNorm = normalizePhone(form.customerPhone);
    if (
      senderPhoneNorm &&
      receiverPhoneNorm &&
      senderPhoneNorm === receiverPhoneNorm
    ) {
      problems.push("Sender and receiver phone cannot be the same");
    }
    const senderAddressNorm = normalizeText(form.senderAddress);
    const deliveryAddressNorm = normalizeText(form.deliveryAddress);
    if (
      senderAddressNorm &&
      deliveryAddressNorm &&
      senderAddressNorm === deliveryAddressNorm
    ) {
      problems.push("Sender and receiver address cannot be the same");
    }
    if (problems.length > 0) {
      showError("Validation Error", problems.join(" • "));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        reference: form.reference || generateReference(),
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
        priority: form.priority as "standard" | "express",
        paymentMethod: form.paymentMethod as "prepaid" | "cod",
        deliveryFee: form.deliveryFee ? Number(form.deliveryFee) : undefined,
        codAmount: form.codAmount ? Number(form.codAmount) : undefined,
        notes: form.notes || undefined,
        isDraft,
        assignedDriverId: form.assignedDriverId || undefined,
        serviceType: form.serviceType as "1" | "5" | "9",
      };
      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.error.fieldErrors) {
          const fieldErrors = Object.values(data.error.fieldErrors);
          // map the fieldErrors to a string of the keys and values
          const errorMessage = fieldErrors.map((error) => {
            return Object.entries(error as Record<string, string>)
              .map(([key, value]) => `${key}: ${value}`)
              .join(" • ");
          });
          showError("Validation Error", errorMessage.join(" • "));
        } else {
          showError("Save Failed", "Failed to save delivery");
        }
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

      router.push("/admin/deliveries");
    } finally {
      setSaving(false);
    }
  }

  const totalAmount =
    (Number(form.deliveryFee || 0) || 0) + (Number(form.codAmount || 0) || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create Delivery
          </h1>
        </div>
        <Link
          href="/admin/deliveries"
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-[13px] text-slate-600">
                  Reference Number
                </label>
                <Input
                  placeholder="SS1000"
                  value={form.reference}
                  disabled={loadingReference}
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
              <div>
                <label className="text-[13px] text-slate-600">
                  Assign Driver
                </label>
                <Select
                  value={form.assignedDriverId}
                  onChange={(e) =>
                    update(
                      "assignedDriverId",
                      (e.target as HTMLSelectElement).value
                    )
                  }
                >
                  <option value="">Select Driver</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.role === "driver"
                        ? `${d.firstName} ${d.lastName}`
                        : `${d.courierCompanyName}`}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Service Type
                </label>
                <Select
                  value={form.serviceType}
                  onChange={(e) =>
                    update(
                      "serviceType",
                      (e.target as HTMLSelectElement).value as "1" | "5" | "9"
                    )
                  }
                >
                  <option value="">Select Service Type</option>
                  <option value="1">Shipz Solutions</option>
                  <option value="5">JNT</option>
                  <option value="9">IMILE</option>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Sender Information
            </h2>
            {form.assignedDriverId === restrictedDriverId && (
              <div>
                <label className="text-[13px] text-slate-600">
                  Select Client
                </label>
                <Select
                  value={form.selectedClientId}
                  onChange={(e) =>
                    handleClientSelection((e.target as HTMLSelectElement).value)
                  }
                  disabled={loadingClients}
                >
                  <option value="">
                    {loadingClients ? "Loading clients..." : "Select a client"}
                  </option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {`${client.firstName} ${client.lastName}`.trim()}
                      {client.phone && ` - ${client.phone}`}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">
                  Sender Name
                </label>
                <Input
                  placeholder={
                    form.assignedDriverId === restrictedDriverId
                      ? "Select a client first"
                      : "Enter sender name"
                  }
                  value={form.senderName}
                  readOnly={form.assignedDriverId === restrictedDriverId}
                  className={
                    form.assignedDriverId === restrictedDriverId
                      ? "bg-gray-50"
                      : ""
                  }
                  onChange={
                    form.assignedDriverId !== restrictedDriverId
                      ? (e) => update("senderName", e.target.value)
                      : undefined
                  }
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Sender Phone
                </label>
                <div className="flex">
                  <div className="flex items-center px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm text-gray-600">
                    +966
                  </div>
                  <Input
                    placeholder="5XXXXXXXX"
                    type="tel"
                    maxLength={9}
                    value={form.senderPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 9) {
                        update("senderPhone", value);
                      }
                    }}
                    className="rounded-l-none"
                    readOnly={form.assignedDriverId === restrictedDriverId}
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Enter 9 digits only (without country code)
                </div>
              </div>
            </div>
            <div>
              <label className="text-[13px] text-slate-600">
                Sender Address
              </label>
              <Input
                placeholder="2929, Unit (D), Rayhanah Bint Zaid, 8118"
                value={form.senderAddress}
                onChange={(e) => update("senderAddress", e.target.value)}
                readOnly={form.assignedDriverId === restrictedDriverId}
              />
            </div>
            <div>
              <label className="text-[13px] text-slate-600">Sender City</label>
              <Select
                value={form.senderCity}
                onChange={(e) => {
                  const city = (e.target as HTMLSelectElement).value;
                  update("senderCity", city);
                  // Reset district when city changes
                  update("senderDistrict", "");
                }}
                disabled={form.assignedDriverId === restrictedDriverId}
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
              <label className="text-[13px] text-slate-600">
                Sender District
              </label>
              <Select
                value={form.senderDistrict}
                onChange={(e) =>
                  update(
                    "senderDistrict",
                    (e.target as HTMLSelectElement).value
                  )
                }
                disabled={form.assignedDriverId === restrictedDriverId}
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
                  placeholder="Jane Smith"
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
                placeholder="2929, Unit (D), Rayhanah Bint Zaid, 8118"
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
                {serviceCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            {/* <div>
              <label className="text-[13px] text-slate-600">District</label>
              <Select
                value={form.deliveryDistrict}
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
                  {form.assignedDriverId === restrictedDriverId ? (
                    <option value="cod">Cash on Delivery</option>
                  ) : (
                    <>
                      <option value="prepaid">Prepaid</option>
                      <option value="cod">Cash on Delivery</option>
                    </>
                  )}
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
                  placeholder={
                    form.assignedDriverId === restrictedDriverId
                      ? "Auto-populated from client"
                      : "Enter delivery fee"
                  }
                  value={form.deliveryFee}
                  readOnly={form.assignedDriverId === restrictedDriverId}
                  className={
                    form.assignedDriverId === restrictedDriverId
                      ? "bg-gray-50"
                      : ""
                  }
                  onChange={
                    form.assignedDriverId !== restrictedDriverId
                      ? (e) => update("deliveryFee", e.target.value)
                      : undefined
                  }
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
              <div>
                <label className="text-[13px] text-slate-600">
                  Total Amount (﷼)
                </label>
                <Input value={String(totalAmount)} disabled />
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
            disabled={saving}
            variant="secondary"
            onClick={() => submit(true)}
          >
            {saving ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            disabled={saving}
            variant="gradient"
            onClick={() => submit(false)}
          >
            {saving ? "Submitting..." : "Create Delivery"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
