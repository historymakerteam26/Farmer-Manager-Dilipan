import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import AIRecord from "@/models/AIRecord";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { parseISO } from "date-fns";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = requireAuth(request); // both admin & staff can update follow-ups
    if (!authCheck.user) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();
    const { id } = params;
    const body = await request.json();

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const record = await AIRecord.findOne({
      ...(isObjectId ? { _id: id } : { aiRecordId: id }),
      isDeleted: false,
    }).populate("farmerId", "name mobile");

    if (!record) {
      return NextResponse.json({ error: "AI Record not found" }, { status: 404 });
    }

    const {
      heatResult,
      heatCheckDate,
      pdStatus,
      pdDate,
      calvingDate,
      calfPhotoUrl,
      remarks,
    } = body;

    let changesDescription = [];

    if (heatResult !== undefined && heatResult !== record.heatResult) {
      changesDescription.push(`Heat: ${record.heatResult} -> ${heatResult}`);
      record.heatResult = heatResult;
    }

    if (heatCheckDate !== undefined) {
      record.heatCheckDate = heatCheckDate ? (typeof heatCheckDate === "string" ? parseISO(heatCheckDate) : new Date(heatCheckDate)) : undefined;
    }

    if (pdStatus !== undefined && pdStatus !== record.pdStatus) {
      changesDescription.push(`PD Status: ${record.pdStatus} -> ${pdStatus}`);
      record.pdStatus = pdStatus;
    }

    if (pdDate !== undefined) {
      record.pdDate = pdDate ? (typeof pdDate === "string" ? parseISO(pdDate) : new Date(pdDate)) : undefined;
    }

    if (calvingDate !== undefined) {
      record.calvingDate = calvingDate ? (typeof calvingDate === "string" ? parseISO(calvingDate) : new Date(calvingDate)) : undefined;
      if (calvingDate) changesDescription.push("Calving recorded");
    }

    if (calfPhotoUrl !== undefined) {
      record.calfPhotoUrl = calfPhotoUrl;
    }

    if (remarks !== undefined) {
      record.remarks = remarks;
    }

    await record.save();

    await logActivity({
      userId: authCheck.user.userId,
      action: "UPDATE_FOLLOW_UP",
      module: "FollowUp",
      recordId: record.aiRecordId,
      description: `Updated follow-up for cow '${record.cowName || record.cowId}': ${changesDescription.join(", ") || "Remarks updated"}.`,
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error("PUT /api/follow-ups/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update follow-up" },
      { status: 500 }
    );
  }
}
