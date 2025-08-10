import { Schema, model, models, type Model } from "mongoose";

export type CodReportFormat = "PDF" | "Excel" | "CSV";
export type CodReportStatus = "ready" | "processing";

export interface CodReportDocument {
  _id: string;
  name: string;
  from: Date;
  to: Date;
  format: CodReportFormat;
  status: CodReportStatus;
  url?: string;
  createdById?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const codReportSchema = new Schema<CodReportDocument>(
  {
    name: { type: String, required: true, unique: true, index: true },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    format: { type: String, enum: ["PDF", "Excel", "CSV"], required: true },
    status: { type: String, enum: ["ready", "processing"], default: "ready" },
    url: String,
    createdById: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const CodReport: Model<CodReportDocument> =
  (models.CodReport as Model<CodReportDocument>) ||
  model<CodReportDocument>("CodReport", codReportSchema);
