"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { EyeIcon } from "@/components/icons";
import Image from "next/image";

export default function ClientLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

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
        setError(data?.error ?? "Invalid email or password");
        setLoading(false);
        return;
      }
      // No client-side 3rd-party login persistence; backend handles token refresh via cron
      router.push("/client");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 z-0">
        <Image
          src="/imagee.jpg"
          alt="Logistics Background"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        {/* Logo and Header */}
        <div className="flex justify-center gap-0 mb-0">
          <div className=" flex items-center justify-center">
            <Image
              src="/favicon.png"
              alt="Shipz Logo"
              width={160}
              height={50}
              className="text-white font-bold text-lg"
            />
          </div>
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-[18px] font-semibold text-black">
              Shipz Customer Portal
            </h1>
            <p className="text-sm text-center text-black">
              Sign in to your Shipz account
            </p>
          </div>
        </div>

        <Card className="bg-white/35 backdrop-blur-sm shadow-2xl border-0 py-3 px-4 sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Password
              </label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <EyeIcon size={16} />
                  </button>
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#0EA5E9] focus:ring-[#0EA5E9] border-slate-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-slate-700"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-[#0EA5E9] hover:text-[#0C94CF]"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              Sign In
            </Button>
          </form>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            Need assistance?{" "}
            <Link
              href="mailto:hello@shipzsolutions.com?subject=Shipz Portal Support"
              className="font-medium text-[#0EA5E9] hover:text-[#0C94CF]"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
      <div className="mt-4 text-left w-full z-10 mt-20 lg:mt-40">
        © Shipz Solutions {new Date().getFullYear()}. All Right Reserved.
      </div>
    </div>
  );
}
