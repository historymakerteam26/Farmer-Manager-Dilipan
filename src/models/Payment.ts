import mongoose, { Schema, Model, Document } from "mongoose";
import { IPayment } from "@/types";

export interface PaymentDocument extends Omit<IPayment, "_id">, Document {}

const PaymentSchema = new Schema<PaymentDocument>(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: "Farmer", required: true, index: true },
    date: { type: Date, required: true, default: Date.now },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true },
    status: { type: String, enum: ["Pending", "Paid"], default: "Pending", index: true },
    paidDate: { type: Date },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

PaymentSchema.index({ farmerId: 1, status: 1, isDeleted: 1 });

export const Payment: Model<PaymentDocument> =
  mongoose.models.Payment || mongoose.model<PaymentDocument>("Payment", PaymentSchema);

export default Payment;
