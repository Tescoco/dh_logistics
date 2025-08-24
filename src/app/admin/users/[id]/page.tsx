"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { SAUDI_CITIES } from "@/lib/cities";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = params?.id as string;
  const { showError, showSuccess } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("customer");
  const [isActive, setIsActive] = useState(true);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) throw new Error("Failed to load user");
        const data = await res.json();
        if (!mounted) return;
        const u = data.user as {
          firstName?: string;
          lastName?: string;
          phone?: string;
          email?: string;
          role?: string;
          isActive?: boolean;
          address?: string;
          city?: string;
          district?: string;
          postalCode?: string;
        };
        setFirstName(u.firstName || "");
        setLastName(u.lastName || "");
        setPhone(u.phone || "");
        setEmail(u.email || "");
        setRole(u.role || "customer");
        setIsActive(Boolean(u.isActive));
        setAddress(u.address || "");
        setCity(u.city || "");
        setDistrict(u.district || "");
        setPostalCode(u.postalCode || "");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [userId]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          phone: phone || undefined,
          role: role as "admin" | "driver" | "manager" | "customer",
          isActive,
          address: address || undefined,
          city: city || undefined,
          district: district || undefined,
          postalCode: postalCode || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showError("Update Failed", d?.error ?? "Failed to update user");
        return;
      }
      showSuccess(
        "User Updated",
        "User information has been updated successfully"
      );
      router.push("/admin/users");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-slate-500">Loading user…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit User</h1>
          <p className="text-slate-500 text-sm">Update user details</p>
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
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-[13px] text-slate-600">First Name</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[13px] text-slate-600">Last Name</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-[13px] text-slate-600">Phone</label>
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
            <div>
              <label className="text-[13px] text-slate-600">Email</label>
              <Input value={email} disabled />
              <p className="text-[11px] text-slate-500 mt-1">
                Email cannot be changed
              </p>
            </div>
          </section>

          {/* Address Information */}
          <section className="space-y-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Address Information
            </h2>
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
                <div>
                  <label className="text-[13px] text-slate-600">District</label>
                  <Select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  >
                    <option value="">Select a district</option>
                    {SAUDI_CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-[13px] text-slate-600">Role</label>
              <Select
                value={role}
                onChange={(e) => setRole((e.target as HTMLSelectElement).value)}
              >
                <option value="admin">Admin</option>
                <option value="customer">Customer</option>
                <option value="driver">Driver</option>
              </Select>
            </div>
            <div>
              <label className="text-[13px] text-slate-600">Status</label>
              <Select
                value={isActive ? "active" : "inactive"}
                onChange={(e) =>
                  setIsActive(
                    (e.target as HTMLSelectElement).value === "active"
                  )
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </section>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <Button
            variant="secondary"
            onClick={() => router.push("/admin/users")}
          >
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
}
