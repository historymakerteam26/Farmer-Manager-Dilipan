import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Farmer from "@/models/Farmer";
import AIRecord from "@/models/AIRecord";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";

export async function POST(request: NextRequest) {
  try {
    const authCheck = requireAuth(request, ["admin"]);
    if (!authCheck.user) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();
    const backupJson = await request.json();

    // Validate structure
    if (!backupJson || !backupJson.data || !Array.isArray(backupJson.data.farmers) || !Array.isArray(backupJson.data.aiRecords)) {
      return NextResponse.json(
        { error: "Invalid backup file format. Expected valid Farmer CRM backup JSON with farmers and AI records data." },
        { status: 400 }
      );
    }

    const { farmers, aiRecords } = backupJson.data;

    let restoredFarmersCount = 0;
    let restoredAIRecordsCount = 0;

    // Upsert Farmers by farmerId or mobile
    for (const farmer of farmers) {
      if (!farmer.farmerId || !farmer.name || !farmer.mobile) continue;
      const { _id, ...farmerData } = farmer;
      await Farmer.findOneAndUpdate(
        { farmerId: farmer.farmerId },
        { $set: farmerData },
        { upsert: true, new: true }
      );
      restoredFarmersCount++;
    }

    // Upsert AI Records by aiRecordId
    for (const record of aiRecords) {
      if (!record.aiRecordId || !record.cowId) continue;
      const { _id, ...recordData } = record;
      await AIRecord.findOneAndUpdate(
        { aiRecordId: record.aiRecordId },
        { $set: recordData },
        { upsert: true, new: true }
      );
      restoredAIRecordsCount++;
    }

    await logActivity({
      userId: authCheck.user.userId,
      action: "DATABASE_BACKUP_RESTORE",
      module: "Backup",
      description: `Admin restored database from backup dated ${backupJson.backupDate || "unknown"}. Restored ${restoredFarmersCount} farmers and ${restoredAIRecordsCount} AI records.`,
    });

    return NextResponse.json({
      success: true,
      message: `Database restored successfully! Processed ${restoredFarmersCount} farmers and ${restoredAIRecordsCount} AI records.`,
      restoredFarmersCount,
      restoredAIRecordsCount,
    });
  } catch (error: any) {
    console.error("Backup restore error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to restore database from backup" },
      { status: 500 }
    );
  }
}
