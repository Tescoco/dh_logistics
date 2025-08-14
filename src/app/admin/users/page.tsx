"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Switch from "@/components/ui/Switch";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import {
  PlusIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  TruckIcon,
  UsersIcon,
  UserIcon,
} from "@/components/icons";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";

type ApiUser = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const router = useRouter();

  const [showAddType, setShowAddType] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [selectedType, setSelectedType] = useState<
    "admin" | "customer" | "driver" | null
  >(null);
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [addingDriver, setAddingDriver] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        if (mounted) setUsers(d.users ?? []);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesTab =
        tab === "all" ||
        (tab === "admins" && u.role === "admin") ||
        (tab === "customers" && u.role === "customer") ||
        (tab === "drivers" && u.role === "driver");
      if (!matchesTab) return false;
      if (!q) return true;
      return [u.firstName, u.lastName, u.email, u.role].some((x) =>
        (x || "").toLowerCase().includes(q)
      );
    });
  }, [users, query, tab]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u._id !== id));
  }

  const [viewUser, setViewUser] = useState<ApiUser | null>(null);
  const [editDriverUser, setEditDriverUser] = useState<ApiUser | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editActive, setEditActive] = useState(false);
  const [savingDriver, setSavingDriver] = useState(false);

  function openEditDriver(u: ApiUser) {
    setEditDriverUser(u);
    setEditFirstName(u.firstName || "");
    setEditLastName(u.lastName || "");
    setEditPhone((u as unknown as { phone?: string }).phone || "");
    setEditActive(Boolean(u.isActive));
  }

  async function saveDriverEdits() {
    if (!editDriverUser) return;
    setSavingDriver(true);
    try {
      const res = await fetch(`/api/users/${editDriverUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editFirstName || undefined,
          lastName: editLastName || undefined,
          phone: editPhone || undefined,
          isActive: editActive,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d?.error ?? "Failed to update driver");
        return;
      }
      const { user: updated } = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u._id === updated._id ? { ...u, ...updated } : u))
      );
      setEditDriverUser(null);
    } finally {
      setSavingDriver(false);
    }
  }

  async function handleAddDriver() {
    if (!driverName || !driverPhone) {
      alert("Driver name and phone are required");
      return;
    }
    const parts = driverName.trim().split(/\s+/);
    const firstName = parts.shift() || "";
    const lastName = parts.join(" ");
    setAddingDriver(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName: lastName,
          phone: driverPhone,
          email: `${Date.now()}+driver@placeholder.local`,
          role: "driver",
          password: Math.random().toString(36).slice(2, 10) + "A1",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? "Failed to add driver");
        return;
      }
      setDriverName("");
      setDriverPhone("");
      setEmployeeId("");
      setVehicleType("");
      setShowAddDriver(false);
      // refresh users list
      setLoading(true);
      fetch("/api/users")
        .then((r) => r.json())
        .then((d) => setUsers(d.users ?? []))
        .finally(() => setLoading(false));
    } finally {
      setAddingDriver(false);
    }
  }
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end">
        <Button
          onClick={() => setShowAddType(true)}
          variant="gradient"
          leftIcon={<PlusIcon size={20} />}
          size="lg"
        >
          Add User
        </Button>
      </div>
      <Card
        className="rounded-2xl border border-slate-200/60 shadow-card"
        padded={false}
      >
        <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-1.5 text-sm font-medium ${
                tab === "all"
                  ? "text-blue-600 bg-blue-50 rounded-lg"
                  : "text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              }`}
              onClick={() => setTab("all")}
            >
              All Users
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium ${
                tab === "admins"
                  ? "text-blue-600 bg-blue-50 rounded-lg"
                  : "text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              }`}
              onClick={() => setTab("admins")}
            >
              Admins
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium ${
                tab === "customers"
                  ? "text-blue-600 bg-blue-50 rounded-lg"
                  : "text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              }`}
              onClick={() => setTab("customers")}
            >
              Customers
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium ${
                tab === "drivers"
                  ? "text-blue-600 bg-blue-50 rounded-lg"
                  : "text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              }`}
              onClick={() => setTab("drivers")}
            >
              Drivers
            </button>
          </div>
          <div className="ml-auto w-80 hidden md:block">
            <Input
              leftIcon={<SearchIcon size={16} />}
              placeholder="Search users..."
              className="border-slate-200"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50/50">
              <tr className="text-left text-slate-600 text-sm">
                {["User", "Role", "Status", "Last Active", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-4 font-semibold first:rounded-tl-xl last:rounded-tr-xl"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                        {[user.firstName, user.lastName]
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {[user.firstName, user.lastName]
                            .filter(Boolean)
                            .join(" ")}
                        </div>
                        <div className="text-sm text-slate-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        user.role === "admin"
                          ? "info"
                          : user.role === "manager"
                          ? "warning"
                          : "default"
                      }
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={user.isActive ? "success" : "neutral"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(user.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewUser(user)}
                        className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
                      >
                        <EyeIcon size={16} />
                        <span className="text-sm font-medium">View</span>
                      </button>
                      <button
                        onClick={() => {
                          if (user.role === "driver") {
                            openEditDriver(user);
                          } else {
                            router.push(`/admin/users/${user._id}`);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
                      >
                        <EditIcon size={16} />
                        <span className="text-sm font-medium">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="inline-flex items-center gap-1.5 text-slate-600 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                      >
                        <TrashIcon size={16} />
                        <span className="text-sm font-medium">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && (
            <div className="p-4 text-sm text-slate-500">Loading users…</div>
          )}
        </div>
      </Card>
      <Modal
        open={!!viewUser}
        onClose={() => setViewUser(null)}
        title="User Details"
      >
        {viewUser && (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-slate-500">Name:</span>{" "}
              <span className="font-medium">
                {[viewUser.firstName, viewUser.lastName]
                  .filter(Boolean)
                  .join(" ")}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Email:</span>{" "}
              <span className="font-medium">{viewUser.email}</span>
            </div>
            <div>
              <span className="text-slate-500">Role:</span>{" "}
              <span className="font-medium">{viewUser.role}</span>
            </div>
            <div>
              <span className="text-slate-500">Status:</span>{" "}
              <span className="font-medium">
                {viewUser.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Created:</span>{" "}
              <span className="font-medium">
                {new Date(viewUser.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Type Modal */}
      <Modal
        open={showAddType}
        onClose={() => setShowAddType(false)}
        title="Add New User"
      >
        <div className="space-y-5">
          <div className="text-sm font-medium text-slate-700">
            Select User Type
          </div>

          <div className="space-y-3">
            {/* Admin option */}
            <button
              type="button"
              className={`w-full rounded-xl border px-4 py-3 text-left transition shadow-sm ${
                selectedType === "admin"
                  ? "border-blue-500 ring-2 ring-blue-100"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              onClick={() => {
                setShowAddType(false);
                router.push(`/admin/users/new?role=admin`);
              }}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center">
                  <UsersIcon size={22} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Admin</div>
                  <div className="text-sm text-slate-600">
                    Full system access and management
                  </div>
                </div>
              </div>
            </button>

            {/* Client option */}
            <button
              type="button"
              className={`w-full rounded-xl border px-4 py-3 text-left transition shadow-sm ${
                selectedType === "customer"
                  ? "border-blue-500 ring-2 ring-blue-100"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              onClick={() => {
                setShowAddType(false);
                router.push(`/admin/users/new?role=customer`);
              }}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 text-white flex items-center justify-center">
                  <UserIcon size={22} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Client</div>
                  <div className="text-sm text-slate-600">
                    Order tracking and management
                  </div>
                </div>
              </div>
            </button>

            {/* Driver option */}
            <button
              type="button"
              className={`w-full rounded-xl border px-4 py-3 text-left transition shadow-sm ${
                selectedType === "driver"
                  ? "border-blue-500 ring-2 ring-blue-100"
                  : "border-slate-200 hover:border-slate-300"
              }`}
              onClick={() => {
                setShowAddType(false);
                setShowAddDriver(true);
              }}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center">
                  <TruckIcon size={22} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Driver</div>
                  <div className="text-sm text-slate-600">
                    Internal delivery driver
                  </div>
                </div>
              </div>
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAddType(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedType}
              onClick={() => {
                if (!selectedType) return;
                if (selectedType === "driver") {
                  setShowAddType(false);
                  setShowAddDriver(true);
                } else {
                  setShowAddType(false);
                  router.push(`/admin/users/new?role=${selectedType}`);
                }
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Driver Modal */}
      <Modal
        open={showAddDriver}
        onClose={() => setShowAddDriver(false)}
        title="Add New Internal Driver"
        widthClassName="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Input
              placeholder="Driver Name"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
            <Input
              placeholder="Phone Number"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
            />
            <Input
              placeholder="Employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />
            <Select
              value={vehicleType}
              onChange={(e) =>
                setVehicleType((e.target as HTMLSelectElement).value)
              }
            >
              <option value="">Select vehicle type</option>
              <option value="car">Car</option>
              <option value="bike">Bike</option>
              <option value="van">Van</option>
              <option value="truck">Truck</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleAddDriver}
              disabled={addingDriver}
              loading={addingDriver}
            >
              {addingDriver ? "Adding…" : "Add Driver"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Driver Modal */}
      <Modal
        open={!!editDriverUser}
        onClose={() => setEditDriverUser(null)}
        title="Edit Driver"
      >
        {editDriverUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">First Name</label>
                <Input
                  placeholder="First name"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">Last Name</label>
                <Input
                  placeholder="Last name"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-[13px] text-slate-600">Phone</label>
              <Input
                placeholder="Phone number"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <div className="text-sm font-medium text-slate-700">Active</div>
              <Switch
                checked={editActive}
                onCheckedChange={(v) => setEditActive(v)}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setEditDriverUser(null)}
              >
                Cancel
              </Button>
              <Button onClick={saveDriverEdits} loading={savingDriver}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
