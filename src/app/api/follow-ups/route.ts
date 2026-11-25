import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import connectToDatabase from "@/lib/mongodb";
import AIRecord from "@/models/AIRecord";
import { requireAuth } from "@/lib/auth";
import { startOfDay, addDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const authCheck = requireAuth(request);
    if (!authCheck.user) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type") || "all"; // "all" | "overdue" | "today" | "upcoming" | "pending" | "completed"
    const search = searchParams.get("search")?.trim() || "";

    const todayStart = startOfDay(new Date());
    const tomorrowStart = addDays(todayStart, 1);
    const next7Days = addDays(todayStart, 7);

    // Fetch all active AI records
    const allRecords = await AIRecord.find({ isDeleted: false })
      .populate("farmerId", "name mobile village farmerId photoUrl")
      .sort({ pdDate: 1, heatCheckDate: 1 })
      .lean();

    // Categorize follow-ups dynamically
    const overdueList: any[] = [];
    const todayList: any[] = [];
    const upcomingList: any[] = [];
    const pendingPdList: any[] = [];
    const completedList: any[] = [];

    allRecords.forEach((record: any) => {
      const isCompleted = ["Pregnant", "Not Pregnant", "Failed"].includes(record.pdStatus);

      if (isCompleted) {
        completedList.push({ ...record, followUpCategory: "completed" });
        return; // Do NOT mark completed records as overdue
      }

      if (record.pdStatus === "Pending" || record.pdStatus === "Recheck Required") {
        pendingPdList.push(record);

        // Check PD date
        if (record.pdDate) {
          const pdDateObj = new Date(record.pdDate);
          if (pdDateObj < todayStart) {
            overdueList.push({ ...record, followUpCategory: "overdue", followUpFor: "PD" });
          } else if (pdDateObj >= todayStart && pdDateObj < tomorrowStart) {
            todayList.push({ ...record, followUpCategory: "today", followUpFor: "PD" });
          } else if (pdDateObj >= tomorrowStart && pdDateObj <= next7Days) {
            upcomingList.push({ ...record, followUpCategory: "upcoming", followUpFor: "PD" });
          }
        }
      }

      // Check Heat check follow-ups (if not checked yet and has heatCheckDate)
      if (record.heatResult === "Not Checked" && record.heatCheckDate) {
        const heatDateObj = new Date(record.heatCheckDate);
        if (heatDateObj < todayStart && !overdueList.some((r) => r._id.toString() === record._id.toString())) {
          overdueList.push({ ...record, followUpCategory: "overdue", followUpFor: "Heat Check" });
        } else if (heatDateObj >= todayStart && heatDateObj < tomorrowStart && !todayList.some((r) => r._id.toString() === record._id.toString())) {
          todayList.push({ ...record, followUpCategory: "today", followUpFor: "Heat Check" });
        } else if (heatDateObj >= tomorrowStart && heatDateObj <= next7Days && !upcomingList.some((r) => r._id.toString() === record._id.toString())) {
          upcomingList.push({ ...record, followUpCategory: "upcoming", followUpFor: "Heat Check" });
        }
      }
    });

    // Filter by type requested
    let results: any[] = [];
    switch (type) {
      case "overdue":
        results = overdueList;
        break;
      case "today":
        results = todayList;
        break;
      case "upcoming":
        results = upcomingList;
        break;
      case "pending":
        results = pendingPdList;
        break;
      case "completed":
        results = completedList;
        break;
      default:
        results = allRecords;
        break;
    }

    if (search) {
      results = results.filter((item: any) => {
        const farmerName = item.farmerId?.name || "";
        const farmerMobile = item.farmerId?.mobile || "";
        const cowName = item.cowName || "";
        const cowId = item.cowId || "";
        const straw = item.strawCode || "";
        const q = search.toLowerCase();
        return (
          farmerName.toLowerCase().includes(q) ||
          farmerMobile.toLowerCase().includes(q) ||
          cowName.toLowerCase().includes(q) ||
          cowId.toLowerCase().includes(q) ||
          straw.toLowerCase().includes(q)
        );
      });
    }

    return NextResponse.json({
      summary: {
        overdueCount: overdueList.length,
        todayCount: todayList.length,
        upcomingCount: upcomingList.length,
        pendingPdCount: pendingPdList.length,
        completedCount: completedList.length,
        total: allRecords.length,
      },
      records: results,
    });
  } catch (error: any) {
    console.error("GET /api/follow-ups error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch follow-ups" },
      { status: 500 }
    );
  }
}
