import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import AIRecord from "@/models/AIRecord";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { parseISO, addDays } from "date-fns";

export async function GET(
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

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const record = await AIRecord.findOne({
      ...(isObjectId ? { _id: id } : { aiRecordId: id }),
      isDeleted: false,
    }).populate("farmerId");

    if (!record) {
      return NextResponse.json({ error: "AI Record not found" }, { status: 404 });
    }

    return NextResponse.json({ record });
  } catch (error: any) {
    console.error("GET /api/ai-records/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch AI record" },
      { status: 500 }
    );
  }
}

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

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const record = await AIRecord.findOne({
      ...(isObjectId ? { _id: id } : { aiRecordId: id }),
      isDeleted: false,
    });

    if (!record) {
      return NextResponse.json({ error: "AI Record not found" }, { status: 404 });
    }

    // Update fields
    if (body.cattleType !== undefined) record.cattleType = body.cattleType;
    if (body.cowName !== undefined) record.cowName = body.cowName?.trim();
    if (body.cowId !== undefined) record.cowId = body.cowId.trim();
    if (body.cowBreed !== undefined) record.cowBreed = body.cowBreed?.trim();
    if (body.attemptNumber !== undefined) record.attemptNumber = Math.max(1, Number(body.attemptNumber) || 1);
    if (body.previousAiRecordId !== undefined) record.previousAiRecordId = body.previousAiRecordId || undefined;
    if (body.aiDate) {
      record.aiDate = typeof body.aiDate === "string" ? parseISO(body.aiDate) : new Date(body.aiDate);
      record.expectedCalvingDate = addDays(record.aiDate, 283);
    }
    if (body.cowPhotoUrl !== undefined) record.cowPhotoUrl = body.cowPhotoUrl;
    if (body.aiRemarks !== undefined) record.aiRemarks = body.aiRemarks?.trim();
    if (body.semenBreed !== undefined) record.semenBreed = body.semenBreed?.trim();
    if (body.bullName !== undefined) record.bullName = body.bullName?.trim();
    if (body.strawCode !== undefined) record.strawCode = body.strawCode?.trim();
    if (body.heatCheckDate) record.heatCheckDate = typeof body.heatCheckDate === "string" ? parseISO(body.heatCheckDate) : new Date(body.heatCheckDate);
    if (body.heatResult !== undefined) record.heatResult = body.heatResult;
    if (body.pdDate) record.pdDate = typeof body.pdDate === "string" ? parseISO(body.pdDate) : new Date(body.pdDate);
    if (body.pdStatus !== undefined) record.pdStatus = body.pdStatus;
    if (body.calvingDate !== undefined) {
      record.calvingDate = body.calvingDate ? (typeof body.calvingDate === "string" ? parseISO(body.calvingDate) : new Date(body.calvingDate)) : undefined;
    }
    if (body.calfPhotoUrl !== undefined) record.calfPhotoUrl = body.calfPhotoUrl;
    if (body.remarks !== undefined) record.remarks = body.remarks?.trim();

    await record.save();

    await logActivity({
      userId: authCheck.user.userId,
      action: "UPDATE_AI_RECORD",
      module: "AIRecord",
      recordId: record.aiRecordId,
      description: `Updated AI record for cow '${record.cowName || record.cowId}' (${record.aiRecordId}).`,
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error("PUT /api/ai-records/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update AI record" },
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

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const record = await AIRecord.findOne({
      ...(isObjectId ? { _id: id } : { aiRecordId: id }),
      isDeleted: false,
    });

    if (!record) {
      return NextResponse.json({ error: "AI Record not found" }, { status: 404 });
    }

    record.isDeleted = true;
    await record.save();

    await logActivity({
      userId: authCheck.user.userId,
      action: "DELETE_AI_RECORD",
      module: "AIRecord",
      recordId: record.aiRecordId,
      description: `Admin deleted AI record ${record.aiRecordId}.`,
    });

    return NextResponse.json({ success: true, message: "AI Record deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/ai-records/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete AI record" },
      { status: 500 }
    );
  }
}
