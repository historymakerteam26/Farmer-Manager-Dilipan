import mongoose, { Schema, Model, Document } from "mongoose";
import { IStrawStock } from "@/types";

export interface StrawStockDocument extends Omit<IStrawStock, "_id">, Document {}

const StrawStockSchema = new Schema<StrawStockDocument>(
  {
    strawTitle: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    strawCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    bullNumber: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

StrawStockSchema.index({ strawTitle: 1, isDeleted: 1 });

export const StrawStock: Model<StrawStockDocument> =
  mongoose.models.StrawStock ||
  mongoose.model<StrawStockDocument>("StrawStock", StrawStockSchema);

export default StrawStock;
