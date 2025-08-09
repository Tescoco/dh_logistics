"use client";

import Card from "@/components/ui/Card";
import Tabs from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { PlusIcon, UploadIcon, SearchIcon } from "@/components/icons";
import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const tabs = [
  { key: "cod", label: "COD Drivers" },
  { key: "internal", label: "Internal Drivers" },
];

export default function DeliveriesPage() {
  return (
    <Suspense fallback={null}>
      <DeliveriesInner />
    </Suspense>
  );
}

function DeliveriesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "cod";
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Deliveries</h1>
          <p className="text-slate-500 text-sm">
            Manage COD and Internal driver deliveries
          </p>
        </div>
      </div>

      <Tabs
        className="-mt-2"
        items={tabs}
        value={tab}
        onChange={(t) => {
          router.push(`/admin/deliveries?tab=${t}`);
        }}
      />

      {tab === "cod" ? <CODTab /> : <InternalTab />}
    </div>
  );
}

function CODTab() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <Button
          onClick={() => {
            router.push("/admin/deliveries/new");
          }}
          leftIcon={<PlusIcon size={18} />}
        >
          Add New Delivery
        </Button>
        <Button variant="secondary" leftIcon={<UploadIcon size={18} />}>
          Bulk Upload CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          "Total COD Orders",
          "Pending Assignment",
          "Out for Delivery",
          "Delivered Today",
        ].map((label) => (
          <Card key={label}>
            <div className="text-[13px] text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold">—</div>
          </Card>
        ))}
      </div>

      <Card header={<div className="font-semibold">Bulk Delivery Upload</div>}>
        <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50 p-10 text-center">
          Drop your delivery CSV file here or click to browse
          <div className="mt-4">
            <Button leftIcon={<UploadIcon size={18} />}>Choose File</Button>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button>Upload & Process Deliveries</Button>
        </div>
      </Card>

      <Card header={<div className="font-semibold">Quick Add Delivery</div>}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <Input placeholder="Customer Name" />
          <Input placeholder="Customer Phone" />
          <Input placeholder="COD Amount" />
          <Input className="md:col-span-2" placeholder="Delivery Address" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
          <Select className="md:col-span-2">
            <option>Select COD Driver</option>
          </Select>
          <div className="md:col-span-3 flex justify-end">
            <Button>Add Delivery</Button>
          </div>
        </div>
      </Card>

      <Card
        header={<div className="font-semibold">COD Deliveries</div>}
        padded={false}
      >
        <div className="p-5 flex items-center gap-4">
          <Select className="w-40">
            <option>All Statuses</option>
          </Select>
          <Input
            className="ml-auto w-80"
            leftIcon={<SearchIcon size={16} />}
            placeholder="Search deliveries..."
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-[13px] text-slate-500">
                {[
                  "Order ID",
                  "Customer",
                  "Phone",
                  "COD Amount",
                  "Assigned Driver",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-5 py-3">COD-2025-00{i}</td>
                  <td className="px-5 py-3">John Smith</td>
                  <td className="px-5 py-3">+1-555-0123</td>
                  <td className="px-5 py-3">$125.50</td>
                  <td className="px-5 py-3">Alex Johnson</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      Delivered
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#0EA5E9]">View</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function InternalTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          "Active Drivers",
          "Assigned Deliveries",
          "In Transit",
          "Completed Today",
        ].map((label) => (
          <Card key={label}>
            <div className="text-[13px] text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold">—</div>
          </Card>
        ))}
      </div>
      <Card
        header={<div className="font-semibold">Add New Internal Driver</div>}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Input placeholder="Driver Name" />
          <Input placeholder="Phone Number" />
          <Input placeholder="Employee ID" />
          <Select>
            <option>Select vehicle type</option>
          </Select>
        </div>
        <div className="mt-4 flex justify-end">
          <Button>Add Driver</Button>
        </div>
      </Card>

      <Card
        header={<div className="font-semibold">Internal Driver Deliveries</div>}
        padded={false}
      >
        <div className="p-5 flex items-center gap-4">
          <Select className="w-40">
            <option>All Statuses</option>
          </Select>
          <Input
            className="ml-auto w-80"
            leftIcon={<SearchIcon size={16} />}
            placeholder="Search by driver or order..."
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-[13px] text-slate-500">
                {[
                  "Order ID",
                  "Customer",
                  "Assigned Driver",
                  "Delivery Address",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="px-5 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-5 py-3">INT-2025-00{i}</td>
                  <td className="px-5 py-3">Robert Brown</td>
                  <td className="px-5 py-3">Tom Wilson</td>
                  <td className="px-5 py-3">123 Oak Street, Downtown</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[12px] font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                      In Transit
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#0EA5E9]">View</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
