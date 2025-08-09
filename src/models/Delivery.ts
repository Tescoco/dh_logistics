import { Schema, model, models, type Model, Types } from "mongoose";

export type DeliveryStatus =
  | "pending"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "returned";

export interface DeliveryDocument {
  _id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  weightKg?: number;
  dimensions?: string;
  packageType?: string;
  description?: string;
  priority?: "standard" | "express";
  paymentMethod?: "prepaid" | "cod";
  deliveryFee?: number;
  codAmount?: number;
  specialInstructions?: string[];
  notes?: string;
  assignedDriverId?: Types.ObjectId;
  status: DeliveryStatus;
  createdById?: Types.ObjectId;
  isDraft?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const deliverySchema = new Schema<DeliveryDocument>(
  {
    reference: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    senderName: String,
    senderPhone: String,
    senderAddress: String,
    weightKg: Number,
    dimensions: String,
    packageType: String,
    description: String,
    priority: {
      type: String,
      enum: ["standard", "express"],
      default: "standard",
    },
    paymentMethod: {
      type: String,
      enum: ["prepaid", "cod"],
      default: "prepaid",
    },
    deliveryFee: { type: Number, default: 0 },
    codAmount: { type: Number, default: 0 },
    specialInstructions: { type: [String], default: [] },
    notes: String,
    assignedDriverId: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_transit", "delivered", "returned"],
      default: "pending",
      index: true,
    },
    createdById: { type: Schema.Types.ObjectId, ref: "User" },
    isDraft: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Delivery: Model<DeliveryDocument> =
  (models.Delivery as Model<DeliveryDocument>) ||
  model<DeliveryDocument>("Delivery", deliverySchema);
