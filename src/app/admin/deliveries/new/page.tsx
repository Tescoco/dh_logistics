import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export const metadata = {
  title: "Create Delivery",
};

export default function CreateDeliveryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create Delivery
          </h1>
        </div>
        <a
          href="/admin/deliveries"
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          ← Back to Deliveries
        </a>
      </div>

      <Card padded={false}>
        <div className="p-5 space-y-8">
          <section className="space-y-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">
                  Reference Number
                </label>
                <Input placeholder="SHIPZ-2025-001" />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Delivery Service
                </label>
                <Select>
                  <option>Select Service</option>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Sender Information
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">
                  Sender Name
                </label>
                <Input placeholder="John Doe" />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Sender Phone
                </label>
                <Input placeholder="+1 234 567 8900" />
              </div>
            </div>
            <div>
              <label className="text-[13px] text-slate-600">
                Sender Address
              </label>
              <Input placeholder="123 Main Street, City, State, ZIP" />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Receiver Information
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">
                  Receiver Name
                </label>
                <Input placeholder="Jane Smith" />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Receiver Phone
                </label>
                <Input placeholder="+1 234 567 8901" />
              </div>
            </div>
            <div>
              <label className="text-[13px] text-slate-600">
                Delivery Address
              </label>
              <Input placeholder="456 Oak Avenue, City, State, ZIP" />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Package Details
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-[13px] text-slate-600">
                  Weight (kg)
                </label>
                <Input placeholder="1.5" />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Dimensions (L×W×H)
                </label>
                <Input placeholder="20×15×10 cm" />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Package Type
                </label>
                <Select>
                  <option>Select Type</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-[13px] text-slate-600">
                Package Description
              </label>
              <Input placeholder="Brief description of package contents" />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Delivery Options
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">Priority</label>
                <Select>
                  <option>Standard</option>
                  <option>Express</option>
                </Select>
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  Payment Method
                </label>
                <Select>
                  <option>Prepaid</option>
                  <option>COD</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[13px] text-slate-600">
                  Delivery Fee ($)
                </label>
                <Input placeholder="25.00" />
              </div>
              <div>
                <label className="text-[13px] text-slate-600">
                  COD Amount ($)
                </label>
                <Input placeholder="0.00" />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Special Instructions
            </h2>
            <div className="grid gap-3">
              <label className="inline-flex items-center gap-2 text-[14px] text-slate-700">
                <input type="checkbox" className="h-4 w-4" /> Fragile - Handle
                with care
              </label>
              <label className="inline-flex items-center gap-2 text-[14px] text-slate-700">
                <input type="checkbox" className="h-4 w-4" /> Signature required
              </label>
              <label className="inline-flex items-center gap-2 text-[14px] text-slate-700">
                <input type="checkbox" className="h-4 w-4" /> Insurance required
              </label>
            </div>
            <div>
              <label className="text-[13px] text-slate-600">
                Additional Notes
              </label>
              <Input placeholder="Any special delivery instructions or notes" />
            </div>
          </section>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <Button variant="secondary">Save as Draft</Button>
          <Button variant="gradient">Create Delivery</Button>
        </div>
      </Card>
    </div>
  );
}
