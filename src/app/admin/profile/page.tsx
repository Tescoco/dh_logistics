import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Profile Settings
        </h1>
        <p className="text-slate-500 text-sm">
          Manage your account settings and preferences
        </p>
      </div>

      <Card padded={false}>
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-slate-200" />
              <div>
                <div className="text-[15px] font-semibold">John Anderson</div>
                <div className="text-[13px] text-slate-500">
                  System Administrator
                </div>
                <div className="text-[13px] text-slate-500">
                  john.anderson@shipz.com
                </div>
              </div>
            </div>
            <Button size="sm">Change Photo</Button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-[13px] text-slate-600">First Name</label>
              <Input placeholder="John" />
            </div>
            <div>
              <label className="text-[13px] text-slate-600">Last Name</label>
              <Input placeholder="Anderson" />
            </div>
          </div>
          <div>
            <label className="text-[13px] text-slate-600">Email Address</label>
            <Input placeholder="john.anderson@shipz.com" />
          </div>
          <div>
            <label className="text-[13px] text-slate-600">Phone Number</label>
            <Input placeholder="+1 (555) 123-4567" />
          </div>
          <div>
            <label className="text-[13px] text-slate-600">Role</label>
            <Input placeholder="System Administrator" />
          </div>
        </div>
      </Card>

      <Card header={<div className="font-semibold">Security Settings</div>}>
        <div className="space-y-4">
          <div>
            <label className="text-[13px] text-slate-600">
              Current Password
            </label>
            <Input placeholder="Enter current password" type="password" />
          </div>
          <div>
            <label className="text-[13px] text-slate-600">New Password</label>
            <Input placeholder="Enter new password" type="password" />
          </div>
          <div>
            <label className="text-[13px] text-slate-600">
              Confirm New Password
            </label>
            <Input placeholder="Confirm new password" type="password" />
          </div>
          <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
            <div>
              <div className="font-medium">
                Enable two-factor authentication
              </div>
              <div className="text-[13px] text-slate-500">
                Increase account security
              </div>
            </div>
            <input type="checkbox" className="h-5 w-5" />
          </div>
          <Button className="w-48" leftIcon={<span>🔑</span>}>
            Update Password
          </Button>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="secondary">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
