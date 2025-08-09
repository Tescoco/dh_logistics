import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { UploadIcon, SearchIcon } from "@/components/icons";

export default function DeliveryStatusPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Delivery Status Management
        </h1>
        <p className="text-slate-500 text-sm">
          Upload CSV files or update delivery statuses
        </p>
      </div>

      <Card header={<div className="font-semibold">CSV Upload</div>}>
        <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50 p-8 text-center">
          <div className="text-slate-600">
            Drop your CSV file here or click to browse
          </div>
          <div className="mt-4">
            <Button leftIcon={<UploadIcon size={18} />}>Choose File</Button>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="danger">Upload & Process</Button>
        </div>
      </Card>

      <Card header={<div className="font-semibold">Bulk Status Update</div>}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr_auto]">
          <Select>
            <option>Pending</option>
            <option>In Transit</option>
            <option>Delivered</option>
          </Select>
          <Input placeholder="DEL001, DEL002, DEL003..." />
          <Button>Update Selected</Button>
        </div>
      </Card>

      <Card
        header={<div className="font-semibold">Recent Deliveries</div>}
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
                  "Delivery ID",
                  "Customer",
                  "Address",
                  "Status",
                  "Last Updated",
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
                  <td className="px-5 py-3">DEL-2025-00{i}</td>
                  <td className="px-5 py-3">John Smith</td>
                  <td className="px-5 py-3">123 Main St, City</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[12px] font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                      In Transit
                    </span>
                  </td>
                  <td className="px-5 py-3">2025-01-15 10:45</td>
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
