"use client";

import React, { useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { UserIcon } from "@/components/icons";
import Select from "@/components/ui/Select";

export default function ClientSettingsPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
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
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/me/avatar", { method: "POST", body: form });
      if (res.ok) {
        const d = await res.json();
        setAvatarUrl(d.avatarUrl);
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleUpdatePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New password and confirmation do not match");
      return;
    }

    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters long");
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        alert(data.error || "Failed to update password");
      }
    } catch (error) {
      console.error("Password update error:", error);
      alert("An error occurred while updating password");
    } finally {
      setUpdatingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-200 grid place-items-center">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-slate-500 text-xs">
                  <UserIcon size={24} />
                </span>
              )}
            </div>
            <div>
              <div className="font-semibold">Profile</div>
              <div className="text-sm text-slate-500">
                Update your profile photo and make it stand out
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUploadAvatar(f);
              }}
            />
            <Button
              className="md:w-auto"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Change Photo"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Account Information */}
      <Card header={<div className="font-semibold">Account Information</div>}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-[12px] text-slate-500 mb-1">First Name</div>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <div className="text-[12px] text-slate-500 mb-1">Last Name</div>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <div className="text-[12px] text-slate-500 mb-1">Email Address</div>
            <Input
              disabled={true}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <div className="text-[12px] text-slate-500 mb-1">Phone Number</div>
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
        </div>

        {/* Address Information */}
        <div className="mt-6 space-y-4">
          <h3 className="text-[15px] font-semibold text-slate-900">
            Address Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <div className="text-[12px] text-slate-500 mb-1">Address</div>
              <Input
                placeholder="Enter street address, building, unit, etc."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div>
              <div className="text-[12px] text-slate-500 mb-1">City</div>
              <Select
                value={city}
                onChange={(e) => setCity((e.target as HTMLSelectElement).value)}
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
              <div className="text-[12px] text-slate-500 mb-1">Postal Code</div>
              <Input
                placeholder="Enter postal code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>

      {/* Security Settings */}
      <Card header={<div className="font-semibold">Security Settings</div>}>
        <div className="space-y-4">
          <div>
            <div className="text-[12px] text-slate-500 mb-1">
              Current Password
            </div>
            <Input
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-[12px] text-slate-500 mb-1">
                New Password
              </div>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <div className="text-[12px] text-slate-500 mb-1">
                Confirm New Password
              </div>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          {/* <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
            <div>
              <div className="font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-slate-500">
                Add an extra layer of security to your account
              </div>
            </div>
            <Button variant="gradient">Enable 2FA</Button>
          </div> */}
          <div className="flex justify-end">
            <Button onClick={handleUpdatePassword} disabled={updatingPassword}>
              {updatingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
