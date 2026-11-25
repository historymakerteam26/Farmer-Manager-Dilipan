import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import connectToDatabase from "@/lib/mongodb";
import AIRecord from "@/models/AIRecord";
import Farmer from "@/models/Farmer";
import StrawStock from "@/models/StrawStock";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { generateUniqueAIRecordId } from "@/lib/id-generator";
import { addDays, parseISO } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const authCheck = requireAuth(request);
    if (!authCheck.user) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const village = searchParams.get("village")?.trim() || "";
    const farmerId = searchParams.get("farmerId")?.trim() || "";
    const pdStatus = searchParams.get("pdStatus")?.trim() || "";
    const heatResult = searchParams.get("heatResult")?.trim() || "";
    const calvingStatus = searchParams.get("calvingStatus")?.trim() || "";
    const startDate = searchParams.get("startDate")?.trim() || "";
    const endDate = searchParams.get("endDate")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "aiDate";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const query: any = { isDeleted: false };

    if (pdStatus && pdStatus !== "all") {
      query.pdStatus = pdStatus;
    }

    if (heatResult && heatResult !== "all") {
      query.heatResult = heatResult;
    }

    if (calvingStatus === "calved") {
      query.calvingDate = { $exists: true, $ne: null };
    } else if (calvingStatus === "not_calved") {
      query.$or = [{ calvingDate: { $exists: false } }, { calvingDate: null }];
    }

    if (startDate || endDate) {
      query.aiDate = {};
      if (startDate) query.aiDate.$gte = parseISO(startDate);
      if (endDate) {
        const end = parseISO(endDate);
        end.setHours(23, 59, 59, 999);
        query.aiDate.$lte = end;
      }
    }

    if (farmerId && farmerId !== "all") {
      query.farmerId = farmerId;
    }

    // If search or village filter requires matching Farmer document
    let matchingFarmerIds: string[] = [];
    if (village && village !== "all") {
      const farmersInVillage = await Farmer.find({ village, isDeleted: false }).select("_id");
      matchingFarmerIds = farmersInVillage.map((f) => f._id.toString());
      query.farmerId = { $in: matchingFarmerIds };
    }

    if (search) {
      // Find farmers matching name, mobile, village
      const farmersMatching = await Farmer.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } },
          { village: { $regex: search, $options: "i" } },
        ],
        isDeleted: false,
      }).select("_id");

      const farmerIdsFromSearch = farmersMatching.map((f) => f._id);

      query.$or = [
        { cowName: { $regex: search, $options: "i" } },
        { cowId: { $regex: search, $options: "i" } },
        { strawCode: { $regex: search, $options: "i" } },
        { bullName: { $regex: search, $options: "i" } },
        { aiRecordId: { $regex: search, $options: "i" } },
        { farmerId: { $in: farmerIdsFromSearch } },
      ];
    }

    const sortObject: any = {};
    sortObject[sortBy] = sortOrder;

    const [records, totalCount] = await Promise.all([
      AIRecord.find(query)
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .populate("farmerId", "name mobile village farmerId photoUrl")
        .lean(),
      AIRecord.countDocuments(query),
    ]);

    return NextResponse.json({
      records,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (error: any) {
    console.error("GET /api/ai-records error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch AI records" },
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
    const {
      farmerId,
      cattleType,
      cowName,
      cowId,
      cowBreed,
      attemptNumber,
      previousAiRecordId,
      aiDate,
      cowPhotoUrl,
      aiRemarks,
      semenBreed,
      bullName,
      strawCode,
      strawStockId,
      strawsDeducted,
      heatCheckDate,
      heatResult,
      pdDate,
      pdStatus,
      calvingDate,
      calfPhotoUrl,
      remarks,
    } = body;

    if (!farmerId) {
      return NextResponse.json({ error: "Farmer selection is required" }, { status: 400 });
    }

    if (!cowId?.trim()) {
      return NextResponse.json({ error: "Cow ID / Ear Tag is required" }, { status: 400 });
    }

    if (!aiDate) {
      return NextResponse.json({ error: "AI Date is required" }, { status: 400 });
    }

    // Verify farmer exists
    const farmer = await Farmer.findOne({ _id: farmerId, isDeleted: false });
    if (!farmer) {
      return NextResponse.json({ error: "Selected farmer does not exist" }, { status: 404 });
    }

    const parsedAiDate = typeof aiDate === "string" ? parseISO(aiDate) : new Date(aiDate);

    // Business Logic: default heat check is 21 days after AI date if not given
    const calculatedHeatCheckDate = heatCheckDate
      ? (typeof heatCheckDate === "string" ? parseISO(heatCheckDate) : new Date(heatCheckDate))
      : addDays(parsedAiDate, 21);

    // Business Logic: default PD check is 90 days after AI date if not given
    const calculatedPdDate = pdDate
      ? (typeof pdDate === "string" ? parseISO(pdDate) : new Date(pdDate))
      : addDays(parsedAiDate, 90);

    // Business Logic: Expected Calving Date is strictly 283 days after AI date
    const calculatedExpectedCalvingDate = addDays(parsedAiDate, 283);

    // Business Logic: Attempt number auto-increment for repeat breeding if not provided
    let resolvedAttemptNumber = Number(attemptNumber);
    if (!resolvedAttemptNumber || resolvedAttemptNumber < 1) {
      const existingAttempts = await AIRecord.countDocuments({
        farmerId,
        cowId: cowId.trim(),
        isDeleted: false,
      });
      resolvedAttemptNumber = existingAttempts + 1;
    }

    // Automatically deduct straw count from StrawStock inventory
    let targetStrawStockId = strawStockId;
    const countToDeduct = Math.max(1, parseInt(strawsDeducted, 10) || 2);

    if (!targetStrawStockId && semenBreed) {
      const matchedStraw = await StrawStock.findOne({
        strawTitle: { $regex: new RegExp(`^${semenBreed.trim()}$`, "i") },
        isDeleted: false,
      });
      if (matchedStraw) {
        targetStrawStockId = matchedStraw._id;
      }
    }

    if (targetStrawStockId) {
      await StrawStock.findByIdAndUpdate(targetStrawStockId, {
        $inc: { strawCount: -countToDeduct },
      });
    }

    const aiRecordId = await generateUniqueAIRecordId();

    const newRecord = await AIRecord.create({
      aiRecordId,
      farmerId,
      cattleType: cattleType || "Cow",
      cowName: cowName?.trim() || "",
      cowId: cowId.trim(),
      cowBreed: cowBreed?.trim() || "",
      attemptNumber: resolvedAttemptNumber,
      previousAiRecordId: previousAiRecordId || undefined,
      aiDate: parsedAiDate,
      cowPhotoUrl: cowPhotoUrl || "",
      aiRemarks: aiRemarks?.trim() || "",
      semenBreed: semenBreed?.trim() || "",
      bullName: bullName?.trim() || "",
      strawCode: strawCode?.trim() || "",
      strawStockId: targetStrawStockId || undefined,
      strawsDeducted: countToDeduct,
      heatCheckDate: calculatedHeatCheckDate,
      heatResult: heatResult || "Not Checked",
      pdDate: calculatedPdDate,
      pdStatus: pdStatus || "Pending",
      expectedCalvingDate: calculatedExpectedCalvingDate,
      calvingDate: calvingDate ? (typeof calvingDate === "string" ? parseISO(calvingDate) : new Date(calvingDate)) : undefined,
      calfPhotoUrl: calfPhotoUrl || "",
      remarks: remarks?.trim() || "",
      isDeleted: false,
    });

    await logActivity({
      userId: authCheck.user.userId,
      action: "CREATE_AI_RECORD",
      module: "AIRecord",
      recordId: newRecord.aiRecordId,
      description: `Created AI record for cow '${newRecord.cowName || newRecord.cowId}' belonging to farmer ${farmer.name}.`,
    });

    return NextResponse.json({ success: true, record: newRecord }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/ai-records error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create AI record" },
      { status: 500 }
    );
  }
}
