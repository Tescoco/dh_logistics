import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Settings } from "@/models/Settings";

export const runtime = "nodejs";

export async function POST() {
  await connectToDatabase();
  try {
    const url = "https://codsolution.co/ship/Api/loginApi";
    const email = "zaidansari864@gmail.com";
    const password = "ZXCasd123@";

    async function requestToken(): Promise<{
      token?: string;
      debug?: unknown;
    }> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        // Attempt 1: x-www-form-urlencoded POST
        const form = new URLSearchParams();
        form.set("email", email);
        form.set("password", password);
        let resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: form.toString(),
          signal: controller.signal,
        });
        let data = (await resp.json().catch(() => null)) as {
          status?: string;
          bearer_token?: string;
          bearerToken?: string;
          token?: string;
        } | null;
        if (data) {
          const token = data.bearer_token || data.bearerToken || data.token;
          if (
            (data.status === "success" || data.status === "Success") &&
            token
          ) {
            return { token };
          }
        }

        // Attempt 2: JSON POST
        resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        });
        data = (await resp.json().catch(() => null)) as {
          status?: string;
          bearer_token?: string;
          bearerToken?: string;
          token?: string;
        } | null;
        if (data) {
          const token = data.bearer_token || data.bearerToken || data.token;
          if (
            (data.status === "success" || data.status === "Success") &&
            token
          ) {
            return { token };
          }
        }

        // Attempt 3: POST with query string
        const urlWithQuery = new URL(url);
        urlWithQuery.searchParams.set("email", email);
        urlWithQuery.searchParams.set("password", password);
        resp = await fetch(urlWithQuery.toString(), {
          method: "POST",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        data = (await resp.json().catch(() => null)) as {
          status?: string;
          bearer_token?: string;
          bearerToken?: string;
          token?: string;
        } | null;
        if (data) {
          const token = data.bearer_token || data.bearerToken || data.token;
          if (
            (data.status === "success" || data.status === "Success") &&
            token
          ) {
            return { token };
          }
        }

        // Attempt 4: GET with query string (some providers implement this)
        const getUrl = new URL(url);
        getUrl.searchParams.set("email", email);
        getUrl.searchParams.set("password", password);
        resp = await fetch(getUrl.toString(), {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        data = (await resp.json().catch(() => null)) as {
          status?: string;
          bearer_token?: string;
          bearerToken?: string;
          token?: string;
        } | null;
        if (data) {
          const token = data.bearer_token || data.bearerToken || data.token;
          if (
            (data.status === "success" || data.status === "Success") &&
            token
          ) {
            return { token };
          }
        }

        return { debug: data };
      } finally {
        clearTimeout(timeout);
      }
    }

    const result = await requestToken();
    if (!result.token) {
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to fetch token",
          debug: result.debug ?? null,
        },
        { status: 502 }
      );
    }
    const doc = (await Settings.findOne()) || (await Settings.create({}));
    doc.thirdPartyBearerToken = result.token;
    doc.thirdPartyTokenUpdatedAt = new Date();
    await doc.save();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("third-party-token cron error", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
