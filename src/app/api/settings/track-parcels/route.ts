import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { Settings } from "@/models/Settings";
import statusMapping from "./statusMapping";
export const runtime = "nodejs";

interface ThirdPartyTrackingResponse {
  success?: boolean;
  data?: Array<{
    tracking_number: string;
    status: string;
    message?: string;
  }>;
  error?: string;
}

interface ShipmentData {
  ShipmentNumber: string;
  ShipmentReference: string;
  date: string;
  time: string;
  comment: string;
  Status: string;
  Status_id: string;
  delivery_service: string;
}

interface DirectShipmentResponse {
  [key: string]: ShipmentData;
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

    const thirdPartyData: ThirdPartyTrackingResponse | DirectShipmentResponse =
      await thirdPartyResponse.json();

    // Handle both response formats: wrapped success/data format and direct shipment data format
    let shipmentDataArray: ShipmentData[] = [];

    if ("success" in thirdPartyData && thirdPartyData.success !== undefined) {
      // Old format with success/data wrapper
      const wrappedResponse = thirdPartyData as ThirdPartyTrackingResponse;
      if (!wrappedResponse.success || !wrappedResponse.data) {
        throw new Error(
          wrappedResponse.error ||
            "Failed to get tracking data from third-party API"
        );
      }
      // Convert old format data to shipment array if needed
      // This would require mapping, but for now assume direct format is used
      throw new Error(
        "Old response format detected but not implemented. Please check API response."
      );
    } else {
      // Direct shipment data format
      const directData = thirdPartyData as DirectShipmentResponse;
      shipmentDataArray = Object.values(directData);
    }

    // Update delivery statuses based on third-party response
    const updateResults = [];
    const statusIdMapping: Record<string, string> = statusMapping.reduce(
      (acc, curr) => {
        if (curr.internal_status) {
          acc[curr.status_id] = curr.internal_status;
        }
        return acc;
      },
      {} as Record<string, string>
    );

    for (const shipmentData of shipmentDataArray) {
      const delivery = deliveries.find(
        (d) => d.thirdPartyShipmentNumber === shipmentData.ShipmentNumber
      );

      if (delivery && shipmentData.Status_id) {
        // Look up status by Status_id from the mapping
        const newStatus =
          statusIdMapping[shipmentData.Status_id] || "in_transit"; // Default to in_transit if no mapping found

        if (newStatus !== delivery.status) {
          // Update delivery status
          await Delivery.findByIdAndUpdate(delivery._id, {
            status: newStatus,
            $push: {
              activityLog: {
                action: "status_updated",
                performedBy: null, // System update
                performedAt: new Date(),
                details: `Status updated via third-party API: ${delivery.status} → ${newStatus}. Third-party status: ${shipmentData.Status}`,
                oldValue: delivery.status,
                newValue: newStatus,
                metadata: {
                  thirdPartyStatus: shipmentData.Status,
                  thirdPartyStatusId: shipmentData.Status_id,
                  thirdPartyComment: shipmentData.comment,
                  thirdPartyDate: shipmentData.date,
                  thirdPartyTime: shipmentData.time,
                },
              },
            },
          });

          updateResults.push({
            deliveryId: delivery._id,
            reference: delivery.reference,
            trackingNumber: shipmentData.ShipmentNumber,
            shipmentReference: shipmentData.ShipmentReference,
            oldStatus: delivery.status,
            newStatus: newStatus,
            thirdPartyStatus: shipmentData.Status,
            updated: true,
          });
        } else {
          updateResults.push({
            deliveryId: delivery._id,
            reference: delivery.reference,
            trackingNumber: shipmentData.ShipmentNumber,
            shipmentReference: shipmentData.ShipmentReference,
            oldStatus: delivery.status,
            newStatus: newStatus,
            thirdPartyStatus: shipmentData.Status,
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
      processedShipments: shipmentDataArray.length,
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
