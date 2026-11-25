import mongoose, { Schema, Model, Document } from "mongoose";
import { IAIRecord } from "@/types";

export interface AIRecordDocument extends Omit<IAIRecord, "_id">, Document {}

const AIRecordSchema = new Schema<AIRecordDocument>(
  {
    aiRecordId: { type: String, required: true, unique: true, index: true },
    farmerId: { type: Schema.Types.ObjectId, ref: "Farmer", required: true, index: true },
    cattleType: {
      type: String,
      enum: ["Cow", "Buffalo", "Heifer"],
      default: "Cow",
    },
    cowName: { type: String, trim: true },
    cowId: { type: String, required: true, trim: true, index: true },
    cowBreed: { type: String, trim: true },
    attemptNumber: { type: Number, default: 1, min: 1, index: true },
    previousAiRecordId: { type: Schema.Types.ObjectId, ref: "AIRecord" },
    aiDate: { type: Date, required: true, index: true },
    cowPhotoUrl: { type: String },
    aiRemarks: { type: String, trim: true },
    semenBreed: { type: String, trim: true },
    bullName: { type: String, trim: true },
    strawCode: { type: String, trim: true, index: true },
    strawStockId: { type: Schema.Types.ObjectId, ref: "StrawStock" },
    strawsDeducted: { type: Number, default: 2 },
    heatCheckDate: { type: Date },
    heatResult: {
      type: String,
      enum: ["Not Checked", "Heat Detected", "No Heat", "Recheck Required"],
      default: "Not Checked",
    },
    pdDate: { type: Date },
    pdStatus: {
      type: String,
      enum: ["Pending", "Pregnant", "Not Pregnant", "Recheck Required", "Failed"],
      default: "Pending",
      index: true,
    },
    expectedCalvingDate: { type: Date, index: true },
    calvingDate: { type: Date },
    calfPhotoUrl: { type: String },
    remarks: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

AIRecordSchema.index({ farmerId: 1, isDeleted: 1 });
AIRecordSchema.index({ pdStatus: 1, pdDate: 1, isDeleted: 1 });
AIRecordSchema.index({ heatCheckDate: 1, heatResult: 1, isDeleted: 1 });

export const AIRecord: Model<AIRecordDocument> =
  mongoose.models.AIRecord || mongoose.model<AIRecordDocument>("AIRecord", AIRecordSchema);

export default AIRecord;
