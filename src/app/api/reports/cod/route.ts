import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { CodReport } from "@/models/CodReport";
import { getAuthUser } from "@/lib/session";

export const runtime = "nodejs";

// This demo route simulates generating a report and returns a fake url
export async function POST(req: NextRequest) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { from, to, format } = body || {};
  if (!from || !to || !format) {
    return NextResponse.json(
      { error: "Missing from/to/format" },
      { status: 400 }
    );
  }
  const name = `COD_Report_${new Date(from).toLocaleString("en-US", {
    month: "short",
  })}_${new Date(from).getFullYear()}`.replace(/\s+/g, "_");
  const report = await CodReport.create({
    name,
    from: new Date(from),
    to: new Date(to),
    format,
    status: "ready",
    url: `/download/${name}.${String(format).toLowerCase()}`,
    createdById: auth.userId,
  });
  return NextResponse.json({
    id: report._id,
    url: report.url,
    status: report.status,
  });
}

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = auth.role !== "admin" ? { createdById: auth.userId } : {};
  const items = await CodReport.find(scope)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return NextResponse.json({
    reports: items.map((r) => ({
      name: r.name,
      range: `${new Date(r.from).toLocaleDateString()} - ${new Date(
        r.to
      ).toLocaleDateString()}`,
      generatedOn: new Date(r.createdAt).toLocaleDateString(),
      format: r.format,
      status: r.status === "ready" ? "Ready" : "Processing",
      url: r.url,
    })),
  });
}
