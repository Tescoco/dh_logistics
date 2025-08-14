"use client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { GoogleIcon, AppleIcon, MicrosoftIcon } from "@/components/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";

// metadata is defined at layout level for server components only

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-[420px]">
        <div className="mb-5 flex items-center gap-2">
          <div className="h-9 w-9 rounded-md bg-[#0EA5E9]" />
          <div>
            <div className="text-[18px] font-semibold">Shipz Solutions</div>
            <div className="text-[12px] text-slate-500">Admin Portal</div>
          </div>
        </div>
        <Card>
          <div className="mb-2 text-xl font-semibold">Admin Login</div>
          <p className="mb-6 text-sm text-slate-500">
            Sign in to access the Shipz admin dashboard
          </p>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setError(null);
              try {
                const res = await fetch("/api/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email, password }),
                });
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  setError(data?.error ?? "Login failed");
                } else {
                  // Check internal token expiry via cookie maxAge already set to 1 day.
                  // Optional: validate 3rd party token still valid before navigating.
                  router.push("/admin/dashboard");
                }
              } catch {
                setError("Network error");
              } finally {
                setLoading(false);
              }
            }}
          >
            <div>
              <label className="text-[13px] text-slate-600">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="admin@shipz.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[13px] text-slate-600">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4" /> Remember me
              </label>
              <a className="text-[#0EA5E9]" href="#">
                Forgot password?
              </a>
            </div>
            {error ? <div className="text-sm text-red-600">{error}</div> : null}
            <Button disabled={loading} variant="gradient" className="w-full">
              {loading ? "Signing in..." : "Sign in to Shipz"}
            </Button>
          </form>

          <div className="mt-6 rounded-md bg-slate-50 p-3 text-[13px] text-slate-600">
            <div className="font-medium">Security Notice</div>
            This is a secure admin area for Shipz. All login attempts are
            monitored and logged for security purposes.
          </div>
        </Card>
        <div className="mt-6 text-center text-[12px] text-slate-500">
          © 2025 Shipz Admin Portal. All rights reserved. | Privacy Policy |
          Terms of Service
        </div>
      </div>
    </div>
  );
}
