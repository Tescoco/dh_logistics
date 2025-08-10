import { Schema, model, models, Model, Document } from "mongoose";

export interface SettingsDocument extends Document {
  systemName: string;
  timeZone: string;
  defaultLanguage: string;
  maintenanceMode: boolean;

  defaultUserRole: "customer" | "driver" | "manager" | "admin";
  autoApproveUsers: boolean;
  allowRegistration: boolean;
  maxLoginAttempts: number;

  standardDeliveryHours: number;
  maxDeliveryRadiusKm: number;
  realTimeTracking: boolean;
  autoAssignDrivers: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<SettingsDocument>(
  {
    systemName: { type: String, default: "Shipz Logistics" },
    timeZone: { type: String, default: "UTC" },
    defaultLanguage: { type: String, default: "English" },
    maintenanceMode: { type: Boolean, default: false },

    defaultUserRole: {
      type: String,
      enum: ["admin", "driver", "manager", "customer"],
      default: "customer",
    },
    autoApproveUsers: { type: Boolean, default: true },
    allowRegistration: { type: Boolean, default: true },
    maxLoginAttempts: { type: Number, default: 5 },

    standardDeliveryHours: { type: Number, default: 24 },
    maxDeliveryRadiusKm: { type: Number, default: 50 },
    realTimeTracking: { type: Boolean, default: true },
    autoAssignDrivers: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Settings: Model<SettingsDocument> =
  (models.Settings as Model<SettingsDocument>) ||
  model<SettingsDocument>("Settings", settingsSchema);
