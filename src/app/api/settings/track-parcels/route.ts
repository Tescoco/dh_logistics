import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { Settings } from "@/models/Settings";

export const runtime = "nodejs";

interface ThirdPartyTrackingResponse {
  success: boolean;
  data?: Array<{
    tracking_number: string;
    status: string;
    message?: string;
  }>;
  error?: string;
}

export async function POST() {
  try {
    await connectToDatabase();

    // Get settings to check if we have the bearer token
    const settings = await Settings.findOne();
    if (!settings?.thirdPartyBearerToken) {
      return NextResponse.json(
        { error: "Third-party bearer token not configured" },
        { status: 400 }
      );
    }

    // Fetch all deliveries where status is not "delivered" and has assignedDriverId
    const deliveries = await Delivery.find({
      status: { $ne: "delivered" },
      assignedDriverId: { $exists: true, $ne: null },
      thirdPartyShipmentNumber: { $exists: true, $ne: null, $nin: [null, ""] },
    }).select("_id reference thirdPartyShipmentNumber status");

    if (deliveries.length === 0) {
      return NextResponse.json({
        message: "No deliveries found for tracking",
        deliveries: [],
      });
    }

    // Extract tracking numbers
    const trackingNumbers = deliveries
      .map((d) => d.thirdPartyShipmentNumber)
      .filter(Boolean) as string[];

    if (trackingNumbers.length === 0) {
      return NextResponse.json({
        message: "No tracking numbers found",
        deliveries: [],
      });
    }

    // Send request to third-party API
    const thirdPartyResponse = await fetch(
      "https://codsolution.co/ship/Api/track_parcel_bulk",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.thirdPartyBearerToken}`,
        },
        body: JSON.stringify({
          tracking_numbers: trackingNumbers,
        }),
      }
    );

    if (!thirdPartyResponse.ok) {
      throw new Error(
        `Third-party API error: ${thirdPartyResponse.status} ${thirdPartyResponse.statusText}`
      );
    }

    const thirdPartyData: ThirdPartyTrackingResponse =
      await thirdPartyResponse.json();

    if (!thirdPartyData.success || !thirdPartyData.data) {
      throw new Error(
        thirdPartyData.error ||
          "Failed to get tracking data from third-party API"
      );
    }

    // Update delivery statuses based on third-party response
    const updateResults = [];
    const statusMapping: Record<string, string> = {
      delivered: "delivered",
      in_transit: "in_transit",
      pending: "pending",
      returned: "returned",
      lost: "lost_damaged",
      damaged: "lost_damaged",
      cancelled: "cancelled",
    };

    for (const trackingData of thirdPartyData.data) {
      const delivery = deliveries.find(
        (d) => d.thirdPartyShipmentNumber === trackingData.tracking_number
      );

      if (delivery && trackingData.status) {
        const newStatus =
          statusMapping[trackingData.status.toLowerCase()] ||
          trackingData.status;

        if (newStatus !== delivery.status) {
          // Update delivery status
          await Delivery.findByIdAndUpdate(delivery._id, {
            status: newStatus,
            $push: {
              activityLog: {
                action: "status_updated",
                performedBy: null, // System update
                performedAt: new Date(),
                details: `Status updated via third-party API: ${delivery.status} → ${newStatus}`,
                oldValue: delivery.status,
                newValue: newStatus,
              },
            },
          });

          updateResults.push({
            deliveryId: delivery._id,
            reference: delivery.reference,
            trackingNumber: trackingData.tracking_number,
            oldStatus: delivery.status,
            newStatus: newStatus,
            updated: true,
          });
        } else {
          updateResults.push({
            deliveryId: delivery._id,
            reference: delivery.reference,
            trackingNumber: trackingData.tracking_number,
            oldStatus: delivery.status,
            newStatus: newStatus,
            updated: false,
            reason: "Status unchanged",
          });
        }
      }
    }

    return NextResponse.json({
      message: `Successfully tracked ${trackingNumbers.length} parcels`,
      totalDeliveries: deliveries.length,
      trackingNumbers: trackingNumbers,
      thirdPartyResponse: thirdPartyData,
      updateResults: updateResults,
    });
  } catch (error) {
    console.error("Error tracking parcels:", error);
    return NextResponse.json(
      {
        error: "Failed to track parcels",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();

    // Get count of deliveries that can be tracked
    const trackableDeliveries = await Delivery.countDocuments({
      status: { $ne: "delivered" },
      assignedDriverId: { $exists: true, $ne: null },
      thirdPartyShipmentNumber: { $exists: true, $ne: null, $nin: [null, ""] },
    });

    // Get count by status
    const statusCounts = await Delivery.aggregate([
      {
        $match: {
          status: { $ne: "delivered" },
          assignedDriverId: { $exists: true, $ne: null },
          thirdPartyShipmentNumber: {
            $exists: true,
            $ne: null,
            $nin: [null, ""],
          },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return NextResponse.json({
      trackableDeliveries,
      statusCounts,
      message: "Tracking summary retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting tracking summary:", error);
    return NextResponse.json(
      {
        error: "Failed to get tracking summary",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
