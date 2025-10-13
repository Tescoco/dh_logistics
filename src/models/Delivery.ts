import { Schema, model, models, type Model, Types } from "mongoose";

export type DeliveryStatus =
  | "pending"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "returned"
  | "future_delivery"
  | "rto"
  | "lost_damaged"
  | "cancelled";

export type CODPaymentStatus = "pending" | "paid" | "returned";

export interface DeliveryDocument {
  _id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  customerWhatsApp?: string;
  customerStoreName?: string; // Store name from customer account
  deliveryAddress: string;
  deliveryCity?: string;
  deliveryDistrict?: string;
  weightKg?: number;
  dimensions?: string;
  packageType?: string;
  description: string;
  priority?: "standard" | "express";
  paymentMethod?: "cod" | "prepaid";
  deliveryFee?: number;
  codAmount?: number;
  returnOrderRate?: number;
  codPaymentStatus?: CODPaymentStatus; // COD payment status
  codPaidAmount?: number; // Amount actually paid for COD
  codPaidDate?: Date; // Date when COD was paid
  codNotes?: string; // Notes about COD payment
  specialInstructions?: string[];
  notes?: string;
  assignedDriverId?: Types.ObjectId;
  assignedCourierId?: Types.ObjectId; // Assigned courier company
  status: DeliveryStatus;
  createdById?: Types.ObjectId;
  isDraft?: boolean;
  thirdPartyShipmentNumber?: string;
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  senderCity?: string;
  senderDistrict?: string;
  senderPostalCode?: string;
  activityLog?: Array<{
    action: string;
    performedBy:
      | Types.ObjectId
      | {
          firstName: string;
          lastName: string;
          role: string;
        };
    performedAt: Date;
    details?: string;
    oldValue?: string;
    newValue?: string;
    metadata?: {
      thirdPartyStatus?: string;
      thirdPartyStatusId?: string;
      thirdPartyComment?: string;
      thirdPartyDate?: string;
      thirdPartyTime?: string;
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
  serviceType: "1" | "5" | "9";
}

const deliverySchema = new Schema<DeliveryDocument>(
  {
    reference: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerWhatsApp: String,
    customerStoreName: String,
    deliveryAddress: { type: String, required: true },
    deliveryCity: String,
    deliveryDistrict: String,
    weightKg: Number,
    dimensions: String,
    packageType: String,
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ["standard", "express"],
      default: "standard",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "prepaid"],
      default: "cod",
    },
    deliveryFee: { type: Number, default: 0 },
    codAmount: { type: Number, default: 0 },
    returnOrderRate: { type: Number, default: 0 },
    codPaymentStatus: {
      type: String,
      enum: ["pending", "paid", "returned"],
      default: "pending",
    },
    codPaidAmount: { type: Number, default: 0 },
    codPaidDate: Date,
    codNotes: String,
    specialInstructions: { type: [String], default: [] },
    notes: String,
    assignedDriverId: { type: Schema.Types.ObjectId, ref: "User" },
    assignedCourierId: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "in_transit",
        "delivered",
        "returned",
        "future_delivery",
        "rto",
        "lost_damaged",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    createdById: { type: Schema.Types.ObjectId, ref: "User" },
    isDraft: { type: Boolean, default: false, index: true },
    thirdPartyShipmentNumber: { type: String },
    activityLog: [
      {
        action: { type: String, required: true },
        performedBy: {
          type: Schema.Types.Mixed, // Allow both ObjectId and object
          required: true,
          validate: {
            validator: function (
              value:
                | Types.ObjectId
                | { firstName: string; lastName: string; role: string }
            ) {
              // Allow ObjectId or object with required fields
              if (value instanceof Types.ObjectId) return true;
              if (
                typeof value === "object" &&
                value !== null &&
                "firstName" in value &&
                "lastName" in value &&
                "role" in value
              ) {
                return value.firstName && value.lastName && value.role;
              }
              return false;
            },
            message:
              "performedBy must be either an ObjectId or an object with firstName, lastName, and role",
          },
        },
        performedAt: { type: Date, default: Date.now },
        details: String,
        oldValue: String,
        newValue: String,
        metadata: {
          thirdPartyStatus: String,
          thirdPartyStatusId: String,
          thirdPartyComment: String,
          thirdPartyDate: String,
          thirdPartyTime: String,
        },
      },
    ],
    senderName: { type: String },
    senderPhone: { type: String },
    senderAddress: { type: String },
    senderCity: { type: String },
    senderDistrict: { type: String },
    senderPostalCode: { type: String },
    serviceType: {
      type: String,
      enum: ["1", "5", "9"],
      default: "1",
    },
  },
  { timestamps: true }
);

// Force model recompilation to ensure schema changes take effect
if (models.Delivery) {
  delete models.Delivery;
}

export const Delivery: Model<DeliveryDocument> = model<DeliveryDocument>(
  "Delivery",
  deliverySchema
);
