import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import connectToDatabase from "@/lib/mongodb";
import Payment from "@/models/Payment";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { parseISO } from "date-fns";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = requireAuth(request);
    if (!authCheck.user) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();
    const { id } = params;
    const body = await request.json();

    const payment = await Payment.findOne({ _id: id, isDeleted: false });
    if (!payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    if (body.farmerId) payment.farmerId = body.farmerId;
    if (body.amount !== undefined) {
      const parsedAmount = parseFloat(body.amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
      }
      payment.amount = parsedAmount;
    }
    if (body.date) {
      payment.date = typeof body.date === "string" ? parseISO(body.date) : new Date(body.date);
    }
    if (body.note !== undefined) payment.note = body.note.trim();
    if (body.status !== undefined) {
      payment.status = body.status;
      if (body.status === "Paid" && !payment.paidDate) {
        payment.paidDate = new Date();
      } else if (body.status === "Pending") {
        payment.paidDate = undefined;
      }
    }

    await payment.save();

    await logActivity({
      userId: authCheck.user.userId,
      action: "UPDATE_PAYMENT",
      module: "Payment",
      recordId: payment._id.toString(),
      description: `Updated payment record (${payment.status}) - ₹${payment.amount}.`,
    });

    const populated = await payment.populate("farmerId", "name mobile village address farmerId");

    return NextResponse.json({ success: true, payment: populated });
  } catch (error: any) {
    console.error("PUT /api/payments/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update payment record" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = requireAuth(request, ["admin"]);
    if (!authCheck.user) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();
    const { id } = params;

    const payment = await Payment.findOne({ _id: id, isDeleted: false });
    if (!payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    payment.isDeleted = true;
    await payment.save();

    await logActivity({
      userId: authCheck.user.userId,
      action: "DELETE_PAYMENT",
      module: "Payment",
      recordId: payment._id.toString(),
      description: `Deleted payment record of ₹${payment.amount}.`,
    });

    return NextResponse.json({ success: true, message: "Payment record deleted" });
  } catch (error: any) {
    console.error("DELETE /api/payments/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete payment record" },
      { status: 500 }
    );
  }
}
