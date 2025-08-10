import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Switch from "@/components/ui/Switch";

export default function SettingsPage() {
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
                defaultValue="Shipz Logistics"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Time Zone
                </label>
                <Select className="mt-2">
                  <option>UTC</option>
                  <option>EST</option>
                  <option>PST</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Default Language
                </label>
                <Select className="mt-2">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
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
              <Switch />
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
              <Select className="mt-2">
                <option>Customer</option>
                <option>Driver</option>
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
              <Switch checked />
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
              <Switch checked />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Max login attempts
              </label>
              <input
                className="mt-2 w-32 rounded-lg border border-slate-200 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                defaultValue={5}
                type="number"
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
                  defaultValue={24}
                  type="number"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Maximum delivery radius (km)
                </label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  defaultValue={50}
                  type="number"
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
                <Switch checked />
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
                <Switch />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
