import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import connectToDatabase from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Farmer from "@/models/Farmer";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { parseISO } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const authCheck = requireAuth(request);
    if (!authCheck.user) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status"); // "Pending", "Paid", or "all"
    const farmerId = searchParams.get("farmerId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const filter: any = { isDeleted: false };

    if (status && status !== "all") {
      filter.status = status;
    }

    if (farmerId) {
      filter.farmerId = farmerId;
    }

    // If searching by farmer name / mobile / village
    if (search?.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const matchedFarmers = await Farmer.find({
        $or: [
          { name: searchRegex },
          { mobile: searchRegex },
          { village: searchRegex },
        ],
        isDeleted: false,
      }).select("_id");

      const farmerIds = matchedFarmers.map((f) => f._id);
      filter.$or = [
        { farmerId: { $in: farmerIds } },
        { note: searchRegex },
      ];
    }

    const total = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter)
      .populate("farmerId", "name mobile village address farmerId")
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Summary calculations across all non-deleted payments
    const summaryAgg = await Payment.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalPendingAmount = 0;
    let pendingCount = 0;
    let totalPaidAmount = 0;
    let paidCount = 0;

    summaryAgg.forEach((item) => {
      if (item._id === "Pending") {
        totalPendingAmount = item.totalAmount;
        pendingCount = item.count;
      } else if (item._id === "Paid") {
        totalPaidAmount = item.totalAmount;
        paidCount = item.count;
      }
    });

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalPendingAmount,
        pendingCount,
        totalPaidAmount,
        paidCount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/payments error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch payment records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = requireAuth(request);
    if (!authCheck.user) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();
    const body = await request.json();
    const { farmerId, amount, date, note, status } = body;

    if (!farmerId) {
      return NextResponse.json({ error: "Please select a farmer" }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Pending amount must be greater than 0" }, { status: 400 });
    }

    const farmer = await Farmer.findOne({ _id: farmerId, isDeleted: false });
    if (!farmer) {
      return NextResponse.json({ error: "Selected farmer not found" }, { status: 404 });
    }

    const paymentDate = date ? (typeof date === "string" ? parseISO(date) : new Date(date)) : new Date();

    const payment = await Payment.create({
      farmerId,
      amount: parsedAmount,
      date: paymentDate,
      note: note?.trim() || "",
      status: status || "Pending",
      paidDate: status === "Paid" ? new Date() : undefined,
      isDeleted: false,
    });

    await logActivity({
      userId: authCheck.user.userId,
      action: "CREATE_PAYMENT",
      module: "Payment",
      recordId: payment._id.toString(),
      description: `Added pending payment of ₹${parsedAmount} for ${farmer.name} (${farmer.village}).`,
    });

    const populated = await payment.populate("farmerId", "name mobile village address farmerId");

    return NextResponse.json({ success: true, payment: populated }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/payments error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create payment record" },
      { status: 500 }
    );
  }
}
