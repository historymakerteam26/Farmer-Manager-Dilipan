import mongoose, { Schema, Model, Document } from "mongoose";
import { IActivityLog } from "@/types";

export interface ActivityLogDocument extends Omit<IActivityLog, "_id">, Document {}

const ActivityLogSchema = new Schema<ActivityLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    action: { type: String, required: true },
    module: {
      type: String,
      enum: ["Farmer", "AIRecord", "Auth", "Backup", "FollowUp", "Payment", "StrawStock"],
      required: true,
    },
    recordId: { type: String },
    description: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivityLogSchema.index({ createdAt: -1 });

export const ActivityLog: Model<ActivityLogDocument> =
  mongoose.models.ActivityLog || mongoose.model<ActivityLogDocument>("ActivityLog", ActivityLogSchema);

export default ActivityLog;
