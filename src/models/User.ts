import { Schema, model, models, type Model } from "mongoose";

export type UserRole = "admin" | "driver" | "manager" | "customer";

export interface UserDocument {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  passwordHash: string;
  avatarUrl?: string;
  deliveryFee: number;
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
      enum: ["admin", "driver", "manager", "customer"],
      default: "customer",
    },
    isActive: { type: Boolean, default: true },
    passwordHash: { type: String, required: true },
    deliveryFee: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User: Model<UserDocument> =
  (models.User as Model<UserDocument>) ||
  model<UserDocument>("User", userSchema);
