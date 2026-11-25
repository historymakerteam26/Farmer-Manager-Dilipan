import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import connectToDatabase from "@/lib/mongodb";
import Farmer from "@/models/Farmer";
import AIRecord from "@/models/AIRecord";
import ActivityLog from "@/models/ActivityLog";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";

export async function GET(request: NextRequest) {
  try {
    const authCheck = requireAuth(request, ["admin"]);
    if (!authCheck.user) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();

    const [farmers, aiRecords, activityLogs] = await Promise.all([
      Farmer.find().lean(),
      AIRecord.find().lean(),
      ActivityLog.find().sort({ createdAt: -1 }).limit(100).lean(),
    ]);

    const backupPayload = {
      app: "Farmer Manager CRM",
      version: "1.0.0",
      backupDate: new Date().toISOString(),
      exportedBy: {
        userId: authCheck.user.userId,
        name: authCheck.user.name,
        email: authCheck.user.email,
      },
      stats: {
        totalFarmers: farmers.length,
        totalAIRecords: aiRecords.length,
        totalActivityLogs: activityLogs.length,
      },
      data: {
        farmers,
        aiRecords,
        activityLogs,
      },
    };

    await logActivity({
      userId: authCheck.user.userId,
      action: "DATABASE_BACKUP_EXPORT",
      module: "Backup",
      description: `Admin exported complete database backup (${farmers.length} farmers, ${aiRecords.length} AI records).`,
    });

    const jsonString = JSON.stringify(backupPayload, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename=farmer_crm_backup_${new Date().toISOString().slice(0, 10)}.json`,
      },
    });
  } catch (error: any) {
    console.error("Backup export error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate database backup" },
      { status: 500 }
    );
  }
}
