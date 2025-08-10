"use client";

import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Switch from "@/components/ui/Switch";
import Button from "@/components/ui/Button";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [systemName, setSystemName] = useState("Shipz Logistics");
  const [timeZone, setTimeZone] = useState("UTC");
  const [defaultLanguage, setDefaultLanguage] = useState("English");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [defaultUserRole, setDefaultUserRole] = useState<
    "customer" | "driver" | "manager" | "admin"
  >("customer");
  const [autoApproveUsers, setAutoApproveUsers] = useState(true);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);

  const [standardDeliveryHours, setStandardDeliveryHours] = useState(24);
  const [maxDeliveryRadiusKm, setMaxDeliveryRadiusKm] = useState(50);
  const [realTimeTracking, setRealTimeTracking] = useState(true);
  const [autoAssignDrivers, setAutoAssignDrivers] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!mounted) return;
        const s = d.settings || {};
        setSystemName(s.systemName ?? "Shipz Logistics");
        setTimeZone(s.timeZone ?? "UTC");
        setDefaultLanguage(s.defaultLanguage ?? "English");
        setMaintenanceMode(Boolean(s.maintenanceMode));

        setDefaultUserRole(s.defaultUserRole ?? "customer");
        setAutoApproveUsers(Boolean(s.autoApproveUsers ?? true));
        setAllowRegistration(Boolean(s.allowRegistration ?? true));
        setMaxLoginAttempts(Number(s.maxLoginAttempts ?? 5));

        setStandardDeliveryHours(Number(s.standardDeliveryHours ?? 24));
        setMaxDeliveryRadiusKm(Number(s.maxDeliveryRadiusKm ?? 50));
        setRealTimeTracking(Boolean(s.realTimeTracking ?? true));
        setAutoAssignDrivers(Boolean(s.autoAssignDrivers ?? false));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemName,
          timeZone,
          defaultLanguage,
          maintenanceMode,
          defaultUserRole,
          autoApproveUsers,
          allowRegistration,
          maxLoginAttempts,
          standardDeliveryHours,
          maxDeliveryRadiusKm,
          realTimeTracking,
          autoAssignDrivers,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d?.error ?? "Failed to save settings");
        return;
      }
      // success
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="text-slate-600 text-base mt-1">
          Configure system preferences, security settings, and application
          behavior
        </p>
        <div className="mt-4">
          <Button onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          className="rounded-2xl border border-slate-200/60 shadow-card"
          header={
            <div className="font-semibold text-lg text-slate-900">
              General Settings
            </div>
          }
        >
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-700">
                System Name
              </label>
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter system name"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Time Zone
                </label>
                <Select
                  className="mt-2"
                  value={timeZone}
                  onChange={(e) =>
                    setTimeZone((e.target as HTMLSelectElement).value)
                  }
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">EST</option>
                  <option value="PST">PST</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Default Language
                </label>
                <Select
                  className="mt-2"
                  value={defaultLanguage}
                  onChange={(e) =>
                    setDefaultLanguage((e.target as HTMLSelectElement).value)
                  }
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-4">
              <div>
                <div className="font-semibold text-slate-900">
                  Maintenance Mode
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Temporarily disable system access for maintenance
                </div>
              </div>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={(v) => setMaintenanceMode(v)}
              />
            </div>
          </div>
        </Card>

        <Card
          className="rounded-2xl border border-slate-200/60 shadow-card"
          header={
            <div className="font-semibold text-lg text-slate-900">
              User Management
            </div>
          }
        >
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Default User Role
              </label>
              <Select
                className="mt-2"
                value={defaultUserRole}
                onChange={(e) =>
                  setDefaultUserRole(
                    (e.target as HTMLSelectElement)
                      .value as typeof defaultUserRole
                  )
                }
              >
                <option value="customer">Customer</option>
                <option value="driver">Driver</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-4">
              <div>
                <div className="font-semibold text-slate-900">
                  Auto-approve new users
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Automatically approve new user registrations
                </div>
              </div>
              <Switch
                checked={autoApproveUsers}
                onCheckedChange={(v) => setAutoApproveUsers(v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-4">
              <div>
                <div className="font-semibold text-slate-900">
                  Allow user registration
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Enable public user sign-ups on the platform
                </div>
              </div>
              <Switch
                checked={allowRegistration}
                onCheckedChange={(v) => setAllowRegistration(v)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Max login attempts
              </label>
              <input
                className="mt-2 w-32 rounded-lg border border-slate-200 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={maxLoginAttempts}
                type="number"
                min={1}
                max={20}
                onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
              />
            </div>
          </div>
        </Card>

        <Card
          className="rounded-2xl border border-slate-200/60 shadow-card lg:col-span-2"
          header={
            <div className="font-semibold text-lg text-slate-900">
              Delivery Configuration
            </div>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Standard delivery time (hours)
                </label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={standardDeliveryHours}
                  type="number"
                  min={1}
                  max={240}
                  onChange={(e) =>
                    setStandardDeliveryHours(Number(e.target.value))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Maximum delivery radius (km)
                </label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={maxDeliveryRadiusKm}
                  type="number"
                  min={1}
                  max={10000}
                  onChange={(e) =>
                    setMaxDeliveryRadiusKm(Number(e.target.value))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-4">
                <div>
                  <div className="font-semibold text-slate-900">
                    Real-time tracking
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    Enable GPS tracking for all deliveries
                  </div>
                </div>
                <Switch
                  checked={realTimeTracking}
                  onCheckedChange={(v) => setRealTimeTracking(v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-4">
                <div>
                  <div className="font-semibold text-slate-900">
                    Auto-assign drivers
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    Automatically assign nearest available driver
                  </div>
                </div>
                <Switch
                  checked={autoAssignDrivers}
                  onCheckedChange={(v) => setAutoAssignDrivers(v)}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
      {loading && (
        <div className="text-sm text-slate-500">Loading settings…</div>
      )}
    </div>
  );
}
