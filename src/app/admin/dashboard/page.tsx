"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  PlusIcon,
  SearchIcon,
  TruckIcon,
  CheckIcon,
  RefreshIcon,
  ClockIcon,
  TrendingUpIcon,
  ArrowUpIcon,
} from "@/components/icons";
import { useRouter } from "next/navigation";

const statCards = [
  {
    label: "Active Deliveries",
    value: 147,
    change: "+12%",
    trending: "up",
    icon: TruckIcon,
    color: "blue",
  },
  {
    label: "Completed",
    value: 892,
    change: "+5%",
    trending: "up",
    icon: CheckIcon,
    color: "green",
  },
  {
    label: "Returned",
    value: 23,
    change: "-2%",
    trending: "down",
    icon: RefreshIcon,
    color: "red",
  },
  {
    label: "Pending Upload",
    value: 34,
    change: "+8%",
    trending: "up",
    icon: ClockIcon,
    color: "yellow",
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-slate-600 text-base mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your deliveries
            today.
          </p>
        </div>
        <Button
          onClick={() => {
            router.push("/admin/deliveries/new");
          }}
          variant="gradient"
          leftIcon={<PlusIcon size={20} />}
          size="lg"
        >
          New Delivery
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const IconComponent = stat.icon;
          const colorClasses = {
            blue: "bg-blue-50 text-blue-600",
            green: "bg-emerald-50 text-emerald-600",
            red: "bg-red-50 text-red-600",
            yellow: "bg-amber-50 text-amber-600",
          };

          return (
            <Card
              key={stat.label}
              className="rounded-2xl border border-slate-200/60 bg-white shadow-card hover:shadow-hover transition-all duration-200 group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm text-slate-600 font-medium">
                    {stat.label}
                  </div>
                  <div className="mt-2 text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {stat.value.toLocaleString()}
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <ArrowUpIcon
                      size={16}
                      className={
                        stat.trending === "up"
                          ? "text-emerald-600"
                          : "text-red-600 rotate-180"
                      }
                    />
                    <span
                      className={`text-sm font-medium ${
                        stat.trending === "up"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-sm text-slate-500">
                      vs last month
                    </span>
                  </div>
                </div>
                <div
                  className={`h-12 w-12 rounded-xl ${
                    colorClasses[stat.color as keyof typeof colorClasses]
                  } flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                >
                  <IconComponent size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2 rounded-2xl border border-slate-200/60 shadow-card"
          header={
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-slate-900">
                Delivery Overview
              </h3>
              <div className="flex items-center gap-2">
                <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 3 months</option>
                </select>
              </div>
            </div>
          }
        >
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
            <div className="text-center">
              <TrendingUpIcon
                size={48}
                className="text-slate-400 mx-auto mb-3"
              />
              <p className="text-slate-600 font-medium">
                Chart visualization would go here
              </p>
              <p className="text-sm text-slate-500">
                Integration with your favorite chart library
              </p>
            </div>
          </div>
        </Card>

        <Card
          className="rounded-2xl border border-slate-200/60 shadow-card"
          header={
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-slate-900">
                Recent Activity
              </h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {[
              {
                action: "New delivery created",
                time: "2 minutes ago",
                icon: TruckIcon,
                color: "blue",
              },
              {
                action: "Package delivered",
                time: "15 minutes ago",
                icon: CheckIcon,
                color: "green",
              },
              {
                action: "Return processed",
                time: "1 hour ago",
                icon: RefreshIcon,
                color: "red",
              },
              {
                action: "Driver assigned",
                time: "2 hours ago",
                icon: TruckIcon,
                color: "blue",
              },
            ].map((activity, idx) => {
              const IconComponent = activity.icon;
              const colorClasses = {
                blue: "bg-blue-50 text-blue-600",
                green: "bg-emerald-50 text-emerald-600",
                red: "bg-red-50 text-red-600",
              };

              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`h-8 w-8 rounded-lg ${
                      colorClasses[activity.color as keyof typeof colorClasses]
                    } flex items-center justify-center flex-shrink-0`}
                  >
                    <IconComponent size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {activity.action}
                    </p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card
        className="rounded-2xl border border-slate-200/60 shadow-card"
        header={
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-slate-900">
              Recent Deliveries
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all deliveries
            </button>
          </div>
        }
        padded={false}
      >
        <div className="px-6 pb-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
              All
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              Active
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              Completed
            </button>
          </div>
          <div className="ml-auto w-80">
            <Input
              leftIcon={<SearchIcon size={16} />}
              placeholder="Search deliveries..."
              className="border-slate-200"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50/50">
              <tr className="text-left text-slate-600 text-sm">
                {[
                  "Delivery ID",
                  "Client",
                  "Status",
                  "Date",
                  "Driver",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 font-semibold first:rounded-tl-xl last:rounded-tr-xl"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                {
                  id: 1,
                  client: "John Doe",
                  status: "Delivered",
                  date: "Jan 15, 2025",
                  driver: "Mike Johnson",
                },
                {
                  id: 2,
                  client: "Sarah Smith",
                  status: "In Transit",
                  date: "Jan 15, 2025",
                  driver: "David Brown",
                },
                {
                  id: 3,
                  client: "Robert Wilson",
                  status: "Pending",
                  date: "Jan 14, 2025",
                  driver: "Not assigned",
                },
                {
                  id: 4,
                  client: "Emily Davis",
                  status: "Delivered",
                  date: "Jan 14, 2025",
                  driver: "Mike Johnson",
                },
              ].map((delivery) => (
                <tr
                  key={delivery.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900">
                      #DD{delivery.id.toString().padStart(3, "0")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                        {delivery.client
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <span className="font-medium text-slate-900">
                        {delivery.client}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        delivery.status === "Delivered"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : delivery.status === "In Transit"
                          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                      }`}
                    >
                      {delivery.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{delivery.date}</td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        delivery.driver === "Not assigned"
                          ? "text-slate-400 italic"
                          : "text-slate-900 font-medium"
                      }
                    >
                      {delivery.driver}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                      View Details
                    </button>
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
