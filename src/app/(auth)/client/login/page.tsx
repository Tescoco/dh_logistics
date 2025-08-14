"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { UserIcon, EyeIcon } from "@/components/icons";
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
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Header */}
        <div className="flex justify-center items-center gap-3 mb-8">
          <div className="h-10 w-10 flex items-center justify-center">
            {/* <span className="text-white font-bold text-lg">S</span> */}
            <Image
              src="/favicon.ico"
              alt="Shipz Logo"
              width={32}
              height={32}
              className="text-white font-bold text-lg"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Shipz Portal</h1>
            <p className="text-sm text-slate-600">
              Sign in to your Shipz account
            </p>
          </div>
        </div>

        <Card className="py-8 px-4 sm:px-10">
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-[#0EA5E9] flex items-center justify-center mb-4">
              <UserIcon size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-600 mt-1">Sign in to your Shipz account</p>
          </div>

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

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
                  By signing in, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="text-[#0EA5E9] hover:text-[#0C94CF]"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-[#0EA5E9] hover:text-[#0C94CF]"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            Need assistance?{" "}
            <Link
              href="/client/support"
              className="font-medium text-[#0EA5E9] hover:text-[#0C94CF]"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
