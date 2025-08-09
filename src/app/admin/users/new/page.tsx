import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export const metadata = {
  title: "Create New User",
};

export default function CreateUserPage() {
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
                <Input placeholder="Enter first name" />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">Last Name</label>
                <Input placeholder="Enter last name" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">
                  Phone Number
                </label>
                <Input placeholder="Enter phone number" />
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
                <Input type="email" placeholder="Enter email address" />
                <p className="mt-1 text-[12px] text-slate-500">
                  This will be used for login and notifications
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[13px] text-slate-600">Password</label>
                  <Input type="password" placeholder="Enter password" />
                  <p className="mt-1 text-[12px] text-slate-500">
                    Minimum 8 characters with letters and numbers
                  </p>
                </div>
                <div>
                  <label className="text-[13px] text-slate-600">
                    Confirm Password
                  </label>
                  <Input type="password" placeholder="Confirm password" />
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
                  <Select>
                    <option>Delivery Driver</option>
                    <option>Admin</option>
                    <option>Customer</option>
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
          <Button variant="secondary">Cancel</Button>
          <Button leftIcon={<span>👥</span>}>Create User</Button>
        </div>
      </Card>
    </div>
  );
}
