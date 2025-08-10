import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { TruckIcon, UserIcon } from "@/components/icons";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-3 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Shipz</h1>
              <p className="text-lg text-slate-600">
                Logistics Management Platform
              </p>
            </div>
          </div>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Streamline your shipping operations with our comprehensive logistics
            platform. Manage deliveries, track packages, and optimize your
            supply chain all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-8 max-w-4xl mx-auto">
          {/* Client Portal */}
          <Card className="p-8 text-center hover:shadow-hover transition-shadow">
            <div className="h-16 w-16 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
              <UserIcon size={32} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              Client Portal
            </h2>
            <p className="text-slate-600 mb-6">
              Track your packages, view shipping history, and manage your
              deliveries with our user-friendly client portal.
            </p>
            <div className="space-y-3">
              <Link href="/client">
                <Button fullWidth>Access Client Portal</Button>
              </Link>
              <Link href="/client/login">
                <Button variant="secondary" fullWidth>
                  Client Login
                </Button>
              </Link>
            </div>
            <div className="mt-6 text-sm text-slate-500">
              <p>Features:</p>
              <ul className="mt-2 space-y-1">
                <li>• Real-time package tracking</li>
                <li>• Shipping history & reports</li>
                <li>• 24/7 customer support</li>
              </ul>
            </div>
          </Card>
        </div>

        <div className="text-center mt-16">
          <Card className="p-6 bg-gradient-to-r from-[#0EA5E9] to-[#0284c7] border-0">
            <h3 className="text-xl font-semibold text-white mb-2">
              Need Help?
            </h3>
            <p className="text-blue-100 mb-4">
              Our support team is available 24/7 to assist you with any
              questions.
            </p>
            <Link href="/client/support">
              <Button variant="secondary">Contact Support</Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
