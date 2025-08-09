"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import {
  PlusIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
} from "@/components/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UsersPage() {
  const [tab, setTab] = useState("all");
  const router = useRouter();
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Users Management
          </h1>
          <p className="text-slate-600 text-base mt-1">
            Manage user accounts, roles, and permissions across your platform
          </p>
        </div>
        <Button
          onClick={() => {
            router.push("/admin/users/new");
          }}
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
                tab === "drivers"
                  ? "text-blue-600 bg-blue-50 rounded-lg"
                  : "text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              }`}
              onClick={() => setTab("drivers")}
            >
              Drivers
            </button>
          </div>
          <div className="ml-auto w-80">
            <Input
              leftIcon={<SearchIcon size={16} />}
              placeholder="Search users..."
              className="border-slate-200"
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
              {[
                {
                  name: "John Smith",
                  email: "john.smith@email.com",
                  role: "Admin",
                  status: "Active",
                  lastActive: "2 hours ago",
                },
                {
                  name: "Sarah Johnson",
                  email: "sarah.j@email.com",
                  role: "Driver",
                  status: "Active",
                  lastActive: "1 day ago",
                },
                {
                  name: "Mike Wilson",
                  email: "mike.w@email.com",
                  role: "Manager",
                  status: "Inactive",
                  lastActive: "1 week ago",
                },
                {
                  name: "Emily Davis",
                  email: "emily.d@email.com",
                  role: "Driver",
                  status: "Active",
                  lastActive: "30 minutes ago",
                },
              ].map((user, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {user.name}
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
                        user.role === "Admin"
                          ? "info"
                          : user.role === "Manager"
                          ? "warning"
                          : "default"
                      }
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={user.status === "Active" ? "success" : "neutral"}
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {user.lastActive}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50">
                        <EyeIcon size={16} />
                        <span className="text-sm font-medium">View</span>
                      </button>
                      <button className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100">
                        <EditIcon size={16} />
                        <span className="text-sm font-medium">Edit</span>
                      </button>
                      <button className="inline-flex items-center gap-1.5 text-slate-600 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
                        <TrashIcon size={16} />
                        <span className="text-sm font-medium">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
