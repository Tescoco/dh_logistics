"use client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { EyeIcon } from "@/components/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// metadata is defined at layout level for server components only

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  return (
    <div className="min-h-screen relative grid place-items-center px-4  ">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/imagee.jpg"
          alt="Logistics Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[420px] mb-30">
        <div className=" flex items-center  gap-2">
          <div className=" flex items-center justify-center">
            <Image
              src="/favicon.png"
              alt="Shipz Logo"
              width={160}
              height={50}
              className="text-white font-bold text-lg"
            />
          </div>
          <div className="text-center">
            <div className="text-[18px] font-semibold text-black">
              Shipz Solutions
            </div>
            <div className="text-[12px] text-center text-black">
              Admin Portal
            </div>
          </div>
        </div>
        <Card
          // transparent
          style={{}}
          className="bg-white/35 backdrop-blur-sm shadow-2xl border-0"
        >
          <div className="mb-2 text-xl font-semibold text-black">
            Admin Login
          </div>
          <p className="mb-6 text-sm text-black">
            Sign in to access the Shipz admin dashboard
          </p>
          <form
            className="space-y-4 text-black"
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
              <label className="text-[13px] text-black">Email Address</label>
              <Input
                type="email"
                placeholder="admin@shipz.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[13px] text-black">Password</label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-black hover:text-slate-600"
                  >
                    <EyeIcon size={16} />
                  </button>
                }
                required
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-black">
                <input type="checkbox" className="h-4 w-4" /> Remember me
              </label>
              <a className="text-[#0EA5E9] text-black" href="#">
                Forgot password?
              </a>
            </div>
            {error ? <div className="text-sm text-red-600">{error}</div> : null}
            <Button
              disabled={loading}
              variant="gradient"
              className="w-full text-black"
            >
              {loading ? "Signing in..." : "Sign in to Shipz"}
            </Button>
          </form>
        </Card>
      </div>
      <div className="mt-4 text-left w-full z-10">
        © Shipz Solutions {new Date().getFullYear()}. All Right Reserved.
      </div>
    </div>
  );
}
