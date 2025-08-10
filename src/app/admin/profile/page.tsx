"use client";

import React, { useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ProfilePage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
        body: JSON.stringify({ firstName, lastName, email, phone, avatarUrl }),
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
      if (res.ok) setAvatarUrl(d.avatarUrl);
      else alert(d?.error || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Profile Settings
        </h1>
        <p className="text-slate-500 text-sm">
          Manage your account settings and preferences
        </p>
      </div>

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
            <Input
              placeholder="+1 (555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[13px] text-slate-600">Role</label>
            <Input placeholder="System Administrator" value={role} disabled />
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
          <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
            <div>
              <div className="font-medium">
                Enable two-factor authentication
              </div>
              <div className="text-[13px] text-slate-500">
                Increase account security
              </div>
            </div>
            <input type="checkbox" className="h-5 w-5" />
          </div>
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
