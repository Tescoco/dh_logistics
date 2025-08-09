"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useRouter } from "next/navigation";
import { useState } from "react";

// metadata is set by a parent server component

export default function CreateUserPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("driver");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
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
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? "Failed to create user");
        return;
      }
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
        <a
          href="/admin/users"
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          ← Back to Users
        </a>
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
                <Input
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="md:col-span-1"></div>
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
              <div>
                <label className="text-[13px] text-slate-600">
                  Delivery Rate (per delivery)
                </label>
                <Input placeholder="0.00" />
                <p className="mt-1 text-[12px] text-slate-500">
                  Amount paid to user per completed delivery
                </p>
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
                    <option value="driver">Delivery Driver</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="customer">Customer</option>
                  </Select>
                </div>
                <div>
                  <label className="text-[13px] text-slate-600">
                    Service Area
                  </label>
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
