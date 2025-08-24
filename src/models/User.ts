import { Schema, model, models, type Model } from "mongoose";

export type UserRole = "admin" | "driver" | "manager" | "customer" | "courier";

export interface UserDocument {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: "admin" | "driver" | "manager" | "customer" | "courier";
  isActive: boolean;
  passwordHash: string;
  deliveryFee?: number;
  returnOrderRate?: number;
  address?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  customerStoreName?: string; // Store name for customer accounts
  courierCompanyName?: string; // Company name for courier accounts
  courierContactEmail?: string; // Contact email for courier companies
  courierContactPhone?: string; // Contact phone for courier companies
  courierServiceAreas?: string[]; // Service areas for courier companies
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: false },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String },
    avatarUrl: { type: String },
    role: {
      type: String,
      enum: ["admin", "driver", "manager", "customer", "courier"],
      default: "customer",
    },
    isActive: { type: Boolean, default: true },
    passwordHash: { type: String, required: true },
    deliveryFee: { type: Number, default: 0 },
    returnOrderRate: { type: Number, default: 0 },
    address: { type: String },
    city: { type: String },
    district: { type: String },
    postalCode: { type: String },
    customerStoreName: { type: String }, // Store name for customer accounts
    courierCompanyName: { type: String }, // Company name for courier accounts
    courierContactEmail: { type: String }, // Contact email for courier companies
    courierContactPhone: { type: String }, // Contact phone for courier companies
    courierServiceAreas: { type: [String], default: [] }, // Service areas for courier companies
  },
  { timestamps: true }
);

export const User: Model<UserDocument> =
  (models.User as Model<UserDocument>) ||
  model<UserDocument>("User", userSchema);
