"use client";

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ClientSettingsPage() {
  const [firstName, setFirstName] = useState("Admin");
  const [lastName, setLastName] = useState("User");
  const [email, setEmail] = useState("admin@shipz.com");
  const [phone, setPhone] = useState("+1 (555) 123-4567");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full overflow-hidden">
              <img
                src="https://i.pravatar.cc/100?img=12"
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="font-semibold">Profile</div>
              <div className="text-sm text-slate-500">
                Update your profile photo and make it stand out
              </div>
            </div>
          </div>
          <Button className="md:w-auto">Change Photo</Button>
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
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <div className="text-[12px] text-slate-500 mb-1">Phone Number</div>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button>Save Changes</Button>
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
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
            <div>
              <div className="font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-slate-500">
                Add an extra layer of security to your account
              </div>
            </div>
            <Button variant="gradient">Enable 2FA</Button>
          </div>
          <div className="flex justify-end">
            <Button>Update Password</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
