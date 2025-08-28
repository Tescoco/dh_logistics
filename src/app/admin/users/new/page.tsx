"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { SAUDI_CITIES } from "@/lib/cities";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";

// metadata is set by a parent server component

export default function CreateUserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState(() => {
    const r = searchParams?.get("role");
    return r === "admin" || r === "customer" ? r : "customer";
  });
  const [submitting, setSubmitting] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [returnOrderRate, setReturnOrderRate] = useState(0);
  const [customerStoreName, setCustomerStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");

  async function handleCreate() {
    if (password !== confirmPassword) {
      showError("Validation Error", "Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: phone || undefined,
          email,
          role,
          password,
          deliveryFee,
          returnOrderRate,
          customerStoreName:
            role === "customer" ? customerStoreName : undefined,
          address: address || undefined,
          city: city || undefined,
          district: district || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError("Creation Failed", data?.error ?? "Failed to create user");
        return;
      }
      showSuccess("User Created", "User has been created successfully");
      router.push("/admin/users");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create New User
          </h1>
          <p className="text-slate-500 text-sm">
            Add a new user to the Shipz delivery system
          </p>
        </div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          ← Back to Users
        </Link>
      </div>

      <Card padded={false}>
        <div className="p-5 space-y-6">
          {/* Personal Information */}
          <section>
            <div className="mb-3 flex items-center gap-2 text-slate-900">
              <span className="inline-grid h-7 w-7 place-items-center rounded-md bg-sky-100 text-sky-600">
                👤
              </span>
              <h2 className="text-[15px] font-semibold">
                Personal Information
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">First Name</label>
                <Input
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">Last Name</label>
                <Input
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">
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
                    value={phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 9) {
                        setPhone(value);
                      }
                    }}
                    className="rounded-l-none"
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Enter 9 digits only (without country code)
                </div>
              </div>
              <div className="md:col-span-1"></div>
            </div>
          </section>

          {/* Address Information */}
          <section>
            <div className="mb-3 flex items-center gap-2 text-slate-900">
              <span className="inline-grid h-7 w-7 place-items-center rounded-md bg-sky-100 text-sky-600">
                🏠
              </span>
              <h2 className="text-[15px] font-semibold">Address Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[13px] text-slate-600">Address</label>
                <Input
                  placeholder="Enter street address, building, unit, etc."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="text-[13px] text-slate-600">City</label>
                  <Select
                    value={city}
                    onChange={(e) =>
                      setCity((e.target as HTMLSelectElement).value)
                    }
                  >
                    <option value="">Select City</option>
                    <option value="Riyadh">Riyadh</option>
                    <option value="Jeddah">Jeddah</option>
                    <option value="Dammam">Dammam</option>
                    <option value="Khobar">Khobar</option>
                    <option value="Dhahran">Dhahran</option>
                    <option value="Abha">Abha</option>
                    <option value="Khamis Mushait">Khamis Mushait</option>
                    <option value="Jubail">Jubail</option>
                    <option value="Jizan">Jizan</option>
                    <option value="Makkah">Makkah</option>
                    <option value="Madinah">Madinah</option>
                    <option value="Tabuk">Tabuk</option>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          {/* Account Information */}
          <section>
            <div className="mb-3 flex items-center gap-2 text-slate-900">
              <span className="inline-grid h-7 w-7 place-items-center rounded-md bg-sky-100 text-sky-600">
                🔐
              </span>
              <h2 className="text-[15px] font-semibold">Account Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[13px] text-slate-600">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="mt-1 text-[12px] text-slate-500">
                  This will be used for login and notifications
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[13px] text-slate-600">Password</label>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="mt-1 text-[12px] text-slate-500">
                    Minimum 8 characters with letters and numbers
                  </p>
                </div>
                <div>
                  <label className="text-[13px] text-slate-600">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Customer Store Name - Only show for customer role */}
            {role === "customer" && (
              <div className="mt-4">
                <label className="text-[13px] text-slate-600">Store Name</label>
                <Input
                  placeholder="Enter store/business name"
                  value={customerStoreName}
                  onChange={(e) => setCustomerStoreName(e.target.value)}
                />
                <p className="mt-1 text-[12px] text-slate-500">
                  This will be used for delivery tracking and identification
                </p>
              </div>
            )}
          </section>

          {/* Delivery Settings */}
          <section>
            <div className="mb-3 flex items-center gap-2 text-slate-900">
              <span className="inline-grid h-7 w-7 place-items-center rounded-md bg-sky-100 text-sky-600">
                🚚
              </span>
              <h2 className="text-[15px] font-semibold">Delivery Settings</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[13px] text-slate-600">
                    Delivery Rate (per delivery)
                  </label>
                  <Input
                    placeholder="0.00"
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  />
                  <p className="mt-1 text-[12px] text-slate-500">
                    Amount paid to user per completed delivery
                  </p>
                </div>
                <div>
                  <label className="text-[13px] text-slate-600">
                    Return Order Rate
                  </label>
                  <Input
                    placeholder="0.00"
                    type="number"
                    value={returnOrderRate}
                    onChange={(e) => setReturnOrderRate(Number(e.target.value))}
                  />
                  <p className="mt-1 text-[12px] text-slate-500">
                    Amount paid to user per returned delivery
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[13px] text-slate-600">
                    User Role
                  </label>
                  <Select
                    value={role}
                    onChange={(e) =>
                      setRole((e.target as HTMLSelectElement).value)
                    }
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </Select>
                </div>
                <div>
                  <label className="text-[13px] text-slate-600">States</label>
                  <Select>
                    <option>Downtown District</option>
                    <option>Uptown</option>
                    <option>Westside</option>
                  </Select>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Card footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <Button
            variant="secondary"
            onClick={() => router.push("/admin/users")}
          >
            Cancel
          </Button>
          <Button
            disabled={submitting}
            leftIcon={<span>👥</span>}
            onClick={handleCreate}
          >
            {submitting ? "Creating..." : "Create User"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
