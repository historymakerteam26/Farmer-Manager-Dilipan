import mongoose, { Schema, Model, Document } from "mongoose";
import { IFarmer } from "@/types";

export interface FarmerDocument extends Omit<IFarmer, "_id">, Document {}

const FarmerSchema = new Schema<FarmerDocument>(
  {
    farmerId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    mobile: { type: String, required: true, trim: true, index: true },
    village: { type: String, required: true, trim: true, index: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },
    photoUrl: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

FarmerSchema.index({ mobile: 1, isDeleted: 1 });
FarmerSchema.index({ village: 1, isDeleted: 1 });
FarmerSchema.index({ name: "text", mobile: "text", village: "text" });

export const Farmer: Model<FarmerDocument> =
  mongoose.models.Farmer || mongoose.model<FarmerDocument>("Farmer", FarmerSchema);

export default Farmer;
