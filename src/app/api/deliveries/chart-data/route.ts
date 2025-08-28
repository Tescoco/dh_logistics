import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { getAuthUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "7"; // 7, 30, or 90 days

  const days = parseInt(period);
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Scope to the requesting user unless admin
  const scope = auth.role !== "admin" ? { createdById: auth.userId } : {};

  try {
    // Aggregate deliveries by day
    const pipeline = [
      {
        $match: {
          ...scope,
          createdAt: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1 as const, "_id.month": 1 as const, "_id.day": 1 as const },
      },
    ];

    const results = await Delivery.aggregate(pipeline);

    // Generate date labels for the period
    const labels: string[] = [];
    const delivered: number[] = [];
    const inTransit: number[] = [];
    const pending: number[] = [];
    const returned: number[] = [];

    // Create a map for quick lookup
    const dataMap = new Map<string, Record<string, number>>();

    results.forEach((item) => {
      const dateKey = `${item._id.year}-${String(item._id.month).padStart(
        2,
        "0"
      )}-${String(item._id.day).padStart(2, "0")}`;

      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, {
          delivered: 0,
          in_transit: 0,
          pending: 0,
          returned: 0,
        });
      }

      const dayData = dataMap.get(dateKey)!;
      dayData[item._id.status as keyof typeof dayData] = item.count;
    });

    // Generate labels and data for each day in the period
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      const dayData = dataMap.get(dateKey) || {
        delivered: 0,
        in_transit: 0,
        pending: 0,
        returned: 0,
      };

      labels.push(
        date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      );

      delivered.push(dayData.delivered);
      inTransit.push(dayData.in_transit);
      pending.push(dayData.pending);
      returned.push(dayData.returned);
    }

    return NextResponse.json({
      labels,
      datasets: [
        {
          label: "Delivered",
          data: delivered,
          borderColor: "rgb(16, 185, 129)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.4,
        },
        {
          label: "In Transit",
          data: inTransit,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
        },
        {
          label: "Pending",
          data: pending,
          borderColor: "rgb(245, 158, 11)",
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          tension: 0.4,
        },
        {
          label: "Returned",
          data: returned,
          borderColor: "rgb(239, 68, 68)",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          tension: 0.4,
        },
      ],
    });
  } catch (error) {
    console.error("Chart data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 }
    );
  }
}
