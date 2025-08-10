"use client";

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type Report = {
  id: string;
  name: string;
  range: string;
  generatedOn: string;
  format: "PDF" | "Excel" | "CSV";
  status: "Ready" | "Processing";
};

const mockReports: Report[] = [
  {
    id: "1",
    name: "COD_Report_Jan_2025",
    range: "Jan 1 - Jan 31, 2025",
    generatedOn: "Feb 1, 2025",
    format: "PDF",
    status: "Ready",
  },
  {
    id: "2",
    name: "COD_Report_Dec_2024",
    range: "Dec 1 - Dec 31, 2024",
    generatedOn: "Jan 2, 2025",
    format: "Excel",
    status: "Ready",
  },
  {
    id: "3",
    name: "COD_Report_Nov_2024",
    range: "Nov 1 - Nov 30, 2024",
    generatedOn: "Dec 1, 2024",
    format: "CSV",
    status: "Processing",
  },
];

export default function ClientCodReportPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [format, setFormat] = useState("PDF");
  const [search, setSearch] = useState("");

  const summary = {
    totalAmount: 45230,
    codDeliveries: 127,
    pendingCOD: 8450,
    collectedCOD: 36780,
  };

  const filtered = mockReports.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              From Date
            </label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              To Date
            </label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Report Format
            </label>
            <Select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option>PDF</option>
              <option>Excel</option>
              <option>CSV</option>
            </Select>
          </div>
          <div className="flex items-end gap-3">
            <Button className="w-full">Generate Report</Button>
            <Button variant="secondary" className="w-full">
              Preview
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-sm text-slate-600">Total COD Amount</div>
          <div className="text-2xl font-bold">
            ₹{summary.totalAmount.toLocaleString()}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-slate-600">COD Deliveries</div>
          <div className="text-2xl font-bold">{summary.codDeliveries}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-slate-600">Pending COD</div>
          <div className="text-2xl font-bold">
            ₹{summary.pendingCOD.toLocaleString()}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-slate-600">Collected COD</div>
          <div className="text-2xl font-bold">
            ₹{summary.collectedCOD.toLocaleString()}
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6 flex items-center justify-between border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Report History
          </h3>
          <div className="w-80">
            <Input
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-700 bg-slate-50">
                    Report Name
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700 bg-slate-50">
                    Date Range
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700 bg-slate-50">
                    Generated On
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700 bg-slate-50">
                    Format
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700 bg-slate-50">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700 bg-slate-50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-4 px-4 text-slate-900 font-medium">
                      {r.name}
                    </td>
                    <td className="py-4 px-4">{r.range}</td>
                    <td className="py-4 px-4">{r.generatedOn}</td>
                    <td className="py-4 px-4">{r.format}</td>
                    <td className="py-4 px-4">
                      <span
                        className={[
                          "inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium border",
                          r.status === "Ready"
                            ? "text-green-700 bg-green-50 border-green-200"
                            : "text-yellow-700 bg-yellow-50 border-yellow-200",
                        ].join(" ")}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary">
                          Download
                        </Button>
                        <Button size="sm" variant="ghost">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
