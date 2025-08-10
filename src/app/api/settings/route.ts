import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Settings } from "@/models/Settings";
import { z } from "zod";

export const runtime = "nodejs";

const SettingsSchema = z.object({
  systemName: z.string().min(1),
  timeZone: z.string().min(1),
  defaultLanguage: z.string().min(1),
  maintenanceMode: z.boolean(),

  defaultUserRole: z.enum(["admin", "driver", "manager", "customer"]),
  autoApproveUsers: z.boolean(),
  allowRegistration: z.boolean(),
  maxLoginAttempts: z.number().int().min(1).max(20),

  standardDeliveryHours: z.number().int().min(1).max(240),
  maxDeliveryRadiusKm: z.number().int().min(1).max(10000),
  realTimeTracking: z.boolean(),
  autoAssignDrivers: z.boolean(),
});

async function getSingletonSettingsDoc() {
  await connectToDatabase();
  let doc = await Settings.findOne();
  if (!doc) {
    doc = await Settings.create({});
  }
  return doc;
}

export async function GET(_req: NextRequest) {
  const doc = await getSingletonSettingsDoc();
  return NextResponse.json({ settings: doc });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const parsed = SettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid settings", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const doc = await getSingletonSettingsDoc();
  Object.assign(doc, parsed.data);
  await doc.save();
  return NextResponse.json({ settings: doc });
}
