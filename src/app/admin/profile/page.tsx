"use client";

import React, { useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/contexts/ToastContext";
import Select from "@/components/ui/Select";
import { SAUDI_CITIES } from "@/lib/cities";

export default function ProfilePage() {
  const { showError, showSuccess } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!mounted) return;
        const u = d.user || {};
        setFirstName(u.firstName || "");
        setLastName(u.lastName || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setRole(u.role || "");
        setAvatarUrl(u.avatarUrl);
        setAddress(u.address || "");
        setCity(u.city || "");
        setDistrict(u.district || "");
        setPostalCode(u.postalCode || "");
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          avatarUrl,
          address: address || undefined,
          city: city || undefined,
          district: district || undefined,
          postalCode: postalCode || undefined,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadAvatar(file: File) {
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/me/avatar", { method: "POST", body: data });
      const d = await res.json();
      if (res.ok) {
        setAvatarUrl(d.avatarUrl);
        showSuccess(
          "Avatar Updated",
          "Profile picture has been updated successfully"
        );
      } else {
        showError("Upload Failed", d?.error || "Failed to upload avatar");
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card padded={false}>
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-slate-200" />
              )}
              <div>
                <div className="text-[15px] font-semibold">
                  {firstName || lastName
                    ? `${firstName} ${lastName}`.trim()
                    : "—"}
                </div>
                <div className="text-[13px] text-slate-500">{role || "—"}</div>
                <div className="text-[13px] text-slate-500">{email || "—"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadAvatar(f);
                }}
              />
              <Button
                size="sm"
                onClick={() => fileRef.current?.click()}
                loading={uploading}
              >
                Change Photo
              </Button>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-[13px] text-slate-600">First Name</label>
              <Input
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[13px] text-slate-600">Last Name</label>
              <Input
                placeholder="Anderson"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-[13px] text-slate-600">Email Address</label>
            <Input
              placeholder="john.anderson@shipz.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[13px] text-slate-600">Phone Number</label>
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
            <label className="text-[13px] text-slate-600">Role</label>
            <Input placeholder="System Administrator" value={role} disabled />
          </div>
        </div>

        {/* Address Information */}
        <div className="mt-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-slate-900">
            Address Information
          </h3>
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
        </div>
      </Card>

      <Card header={<div className="font-semibold">Security Settings</div>}>
        <div className="space-y-4">
          <div>
            <label className="text-[13px] text-slate-600">
              Current Password
            </label>
            <Input placeholder="Enter current password" type="password" />
          </div>
          <div>
            <label className="text-[13px] text-slate-600">New Password</label>
            <Input placeholder="Enter new password" type="password" />
          </div>
          <div>
            <label className="text-[13px] text-slate-600">
              Confirm New Password
            </label>
            <Input placeholder="Confirm new password" type="password" />
          </div>
          {/* <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
            <div>
              <div className="font-medium">
                Enable two-factor authentication
              </div>
              <div className="text-[13px] text-slate-500">
                Increase account security
              </div>
            </div>
            <input type="checkbox" className="h-5 w-5" />
          </div> */}
          <Button className="w-48" leftIcon={<span>🔑</span>} disabled>
            Update Password
          </Button>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Cancel
        </Button>
        <Button onClick={handleSaveProfile} loading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
