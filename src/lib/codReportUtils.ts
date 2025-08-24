import { DeliveryDocument } from "@/models/Delivery";
import { UserDocument } from "@/models/User";

export interface CodReportSummary {
  totalDeliveries: number;
  totalCodAmount: number;
  totalPaidAmount: number;
  pendingAmount: number;
  deliveredCount: number;
  returnedCount: number;
  inTransitCount: number;
  pendingCount: number;
  cancelledCount: number;
  lostDamagedCount: number;
  rtoCount: number;
}

export interface CodReportData {
  reportId: string;
  reportName: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  period: {
    from: string;
    to: string;
  };
  summary: CodReportSummary;
  deliveries: Array<{
    reference: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    deliveryCity?: string;
    deliveryDistrict?: string;
    codAmount: number;
    codPaymentStatus?: string;
    codPaidAmount: number;
    codPaidDate?: Date;
    status: string;
    assignedCourierId?: any;
    createdAt: Date;
    updatedAt: Date;
  }>;
  generatedAt: string;
  generatedBy: string;
}

/**
 * Calculate COD statistics for a list of deliveries
 */
export function calculateCodStats(
  deliveries: DeliveryDocument[]
): CodReportSummary {
  const stats: CodReportSummary = {
    totalDeliveries: deliveries.length,
    totalCodAmount: 0,
    totalPaidAmount: 0,
    pendingAmount: 0,
    deliveredCount: 0,
    returnedCount: 0,
    inTransitCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
    lostDamagedCount: 0,
    rtoCount: 0,
  };

  for (const delivery of deliveries) {
    stats.totalCodAmount += delivery.codAmount || 0;
    stats.totalPaidAmount += delivery.codPaidAmount || 0;

    switch (delivery.status) {
      case "delivered":
        stats.deliveredCount++;
        break;
      case "returned":
        stats.returnedCount++;
        break;
      case "in_transit":
        stats.inTransitCount++;
        break;
      case "pending":
        stats.pendingCount++;
        break;
      case "cancelled":
        stats.cancelledCount++;
        break;
      case "lost_damaged":
        stats.lostDamagedCount++;
        break;
      case "rto":
        stats.rtoCount++;
        break;
    }
  }

  stats.pendingAmount = stats.totalCodAmount - stats.totalPaidAmount;
  return stats;
}

/**
 * Generate a unique report name for a client
 */
export function generateReportName(
  client: UserDocument,
  fromDate: string,
  toDate: string
): string {
  const clientName = client.customerStoreName || client.firstName;
  const month = new Date(fromDate).toLocaleString("en-US", { month: "short" });
  const year = new Date(fromDate).getFullYear();
  const randomSuffix = Math.random().toString(36).substring(2, 6);

  return `COD_Report_${clientName}_${month}_${year}_${randomSuffix}`.replace(
    /\s+/g,
    "_"
  );
}

/**
 * Prepare delivery data for COD report
 */
export function prepareDeliveryData(delivery: DeliveryDocument) {
  return {
    reference: delivery.reference,
    customerName: delivery.customerName,
    customerPhone: delivery.customerPhone,
    deliveryAddress: delivery.deliveryAddress,
    deliveryCity: delivery.deliveryCity,
    deliveryDistrict: delivery.deliveryDistrict,
    codAmount: delivery.codAmount || 0,
    codPaymentStatus: delivery.codPaymentStatus,
    codPaidAmount: delivery.codPaidAmount || 0,
    codPaidDate: delivery.codPaidDate,
    status: delivery.status,
    assignedCourierId: delivery.assignedCourierId,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt,
  };
}

/**
 * Group deliveries by client
 */
export function groupDeliveriesByClient(
  deliveries: DeliveryDocument[]
): Map<string, DeliveryDocument[]> {
  const clientDeliveries = new Map<string, DeliveryDocument[]>();

  for (const delivery of deliveries) {
    const clientId = delivery.createdById?.toString();
    if (clientId) {
      if (!clientDeliveries.has(clientId)) {
        clientDeliveries.set(clientId, []);
      }
      clientDeliveries.get(clientId)!.push(delivery);
    }
  }

  return clientDeliveries;
}
