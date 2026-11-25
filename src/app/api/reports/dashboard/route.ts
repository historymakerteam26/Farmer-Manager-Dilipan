import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import connectToDatabase from "@/lib/mongodb";
import Farmer from "@/models/Farmer";
import AIRecord from "@/models/AIRecord";
import Payment from "@/models/Payment";
import ActivityLog from "@/models/ActivityLog";
import StrawStock from "@/models/StrawStock";
import { requireAuth } from "@/lib/auth";
import { startOfDay, addDays, format, subMonths } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const authCheck = requireAuth(request);
    if (!authCheck.user) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();

    const todayStart = startOfDay(new Date());
    const tomorrowStart = addDays(todayStart, 1);
    const sevenDaysLater = addDays(todayStart, 7);

    // 1. Basic Counts
    const [totalFarmers, totalAIRecords] = await Promise.all([
      Farmer.countDocuments({ isDeleted: false }),
      AIRecord.countDocuments({ isDeleted: false }),
    ]);

    // Straw Stocks
    let strawStocks = await StrawStock.find({ isDeleted: false }).sort({ strawTitle: 1 });
    if (strawStocks.length === 0) {
      await StrawStock.insertMany([
        { strawTitle: "HF", strawCount: 500, bullNumber: "HF-IND-01", description: "Holstein Friesian" },
        { strawTitle: "Jy", strawCount: 300, bullNumber: "JY-TN-22", description: "Jersey High Yield" },
        { strawTitle: "94100(CFS)", strawCount: 50, bullNumber: "CFS-94100", description: "CFS Proven Bull" },
        { strawTitle: "CBHF", strawCount: 100, bullNumber: "CBHF-504", description: "Cross Breed HF" },
        { strawTitle: "GIR", strawCount: 10, bullNumber: "GIR-GUJ-11", description: "Indigenous Gir" },
        { strawTitle: "KANGAYAM", strawCount: 20, bullNumber: "KG-TN-09", description: "Native Kangayam" },
      ]);
      strawStocks = await StrawStock.find({ isDeleted: false }).sort({ strawTitle: 1 });
    }
    const totalStrawCount = strawStocks.reduce((acc, curr) => acc + (curr.strawCount || 0), 0);

    // 2. PD Counts & Overdue calculation
    const allAIRecords = await AIRecord.find({ isDeleted: false })
      .populate("farmerId", "name mobile village")
      .sort({ aiDate: -1 })
      .lean();

    let pdCompleted = 0;
    let pdPending = 0;
    let pdOverdue = 0;
    let totalCalvings = 0;

    const overdueFollowUps: any[] = [];
    const upcomingFollowUps: any[] = [];

    const pdStatusCountMap: Record<string, number> = {
      Pending: 0,
      Pregnant: 0,
      "Not Pregnant": 0,
      "Recheck Required": 0,
      Failed: 0,
    };

    allAIRecords.forEach((rec: any) => {
      const status = rec.pdStatus || "Pending";
      pdStatusCountMap[status] = (pdStatusCountMap[status] || 0) + 1;

      if (["Pregnant", "Not Pregnant", "Failed"].includes(status)) {
        pdCompleted += 1;
      } else {
        pdPending += 1;
        // Check if PD is overdue
        if (rec.pdDate && new Date(rec.pdDate) < todayStart) {
          pdOverdue += 1;
          overdueFollowUps.push(rec);
        } else if (rec.pdDate && new Date(rec.pdDate) >= todayStart && new Date(rec.pdDate) <= sevenDaysLater) {
          upcomingFollowUps.push(rec);
        }
      }

      if (rec.calvingDate) {
        totalCalvings += 1;
      }
    });

    // 3. Monthly AI Registrations (last 6 months aggregation)
    const sixMonthsAgo = startOfDay(subMonths(new Date(), 5));
    const monthlyAIAgg = await AIRecord.aggregate([
      {
        $match: {
          isDeleted: false,
          aiDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: { date: "$aiDate", timezone: "Asia/Kolkata" } },
            month: { $month: { date: "$aiDate", timezone: "Asia/Kolkata" } },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Fill last 6 months cleanly so charts look unbroken
    const monthlyAIRegistrations = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const mStr = format(d, "MMM yyyy");
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const found = monthlyAIAgg.find(
        (item: any) => item._id.year === year && item._id.month === month
      );
      monthlyAIRegistrations.push({
        month: mStr,
        count: found ? found.count : 0,
      });
    }

    // 4. Village Distribution
    const villageAgg = await Farmer.aggregate([
      { $match: { isDeleted: false, village: { $exists: true, $ne: "" } } },
      { $group: { _id: "$village", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    const villageDistribution = villageAgg.map((item: any) => ({
      village: item._id,
      count: item.count,
    }));

    // 5. PD Status Distribution for Donut/Pie Chart
    const pdStatusDistribution = Object.keys(pdStatusCountMap).map((key) => ({
      status: key,
      count: pdStatusCountMap[key],
    }));

    // 6. Monthly Calving Stats
    const monthlyCalvingsAgg = await AIRecord.aggregate([
      {
        $match: {
          isDeleted: false,
          calvingDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: { date: "$calvingDate", timezone: "Asia/Kolkata" } },
            month: { $month: { date: "$calvingDate", timezone: "Asia/Kolkata" } },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthlyCalvings = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const mStr = format(d, "MMM yyyy");
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const found = monthlyCalvingsAgg.find(
        (item: any) => item._id.year === year && item._id.month === month
      );
      monthlyCalvings.push({
        month: mStr,
        count: found ? found.count : 0,
      });
    }

    // 7. Payment Pending Stats
    const paymentAgg = await Payment.aggregate([
      { $match: { isDeleted: false, status: "Pending" } },
      { $group: { _id: null, totalPending: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);
    const totalPendingPayment = paymentAgg[0]?.totalPending || 0;
    const pendingPaymentCount = paymentAgg[0]?.count || 0;

    // 8. Recent Items & Activities
    const [recentFarmers, recentActivities] = await Promise.all([
      Farmer.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5).lean(),
      ActivityLog.find().sort({ createdAt: -1 }).limit(8).populate("userId", "name role").lean(),
    ]);

    const recentAIRecords = allAIRecords.slice(0, 5);

    return NextResponse.json({
      stats: {
        totalFarmers,
        totalAIRecords,
        pdCompleted,
        pdPending,
        pdOverdue,
        totalCalvings,
        totalPendingPayment,
        pendingPaymentCount,
        totalStrawCount,
        upcomingFollowUpsCount: upcomingFollowUps.length,
        overdueFollowUpsCount: overdueFollowUps.length,
      },
      strawStocks,
      charts: {
        monthlyAIRegistrations,
        villageDistribution,
        pdStatusDistribution,
        monthlyCalvings,
      },
      recentFarmers,
      recentAIRecords,
      upcomingFollowUps: upcomingFollowUps.slice(0, 5),
      overdueFollowUps: overdueFollowUps.slice(0, 5),
      recentActivities,
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
