import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import connectToDatabase from "@/lib/mongodb";
import Farmer from "@/models/Farmer";
import AIRecord from "@/models/AIRecord";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { generateUniqueFarmerId } from "@/lib/id-generator";

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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { farmerId: { $regex: search, $options: "i" } },
        { village: { $regex: search, $options: "i" } },
      ];
    }

    if (village && village !== "all") {
      query.village = village;
    }

    const [farmers, totalCount, distinctVillages] = await Promise.all([
      Farmer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name role")
        .lean(),
      Farmer.countDocuments(query),
      Farmer.distinct("village", { isDeleted: false }),
    ]);

    // Attach summary stats for each farmer (AI records count, pregnant cows, pending PD)
    const farmerIds = farmers.map((f: any) => f._id);
    const aiAggregations = await AIRecord.aggregate([
      { $match: { farmerId: { $in: farmerIds }, isDeleted: false } },
      {
        $group: {
          _id: "$farmerId",
          totalAI: { $sum: 1 },
          pregnant: { $sum: { $cond: [{ $eq: ["$pdStatus", "Pregnant"] }, 1, 0] } },
          pendingPd: { $sum: { $cond: [{ $eq: ["$pdStatus", "Pending"] }, 1, 0] } },
          calvings: { $sum: { $cond: [{ $ifNull: ["$calvingDate", false] }, 1, 0] } },
        },
      },
    ]);

    const statsMap = new Map();
    aiAggregations.forEach((item: any) => {
      statsMap.set(item._id.toString(), item);
    });

    const enrichedFarmers = farmers.map((farmer: any) => {
      const stats = statsMap.get(farmer._id.toString()) || {
        totalAI: 0,
        pregnant: 0,
        pendingPd: 0,
        calvings: 0,
      };
      return {
        ...farmer,
        aiRecordsCount: stats.totalAI,
        pregnantCount: stats.pregnant,
        pendingPdCount: stats.pendingPd,
        calvingCount: stats.calvings,
      };
    });

    return NextResponse.json({
      farmers: enrichedFarmers,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
      villages: distinctVillages.filter(Boolean).sort(),
    });
  } catch (error: any) {
    console.error("GET /api/farmers error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch farmers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = requireAuth(request); // both admin & staff can register
    if (!authCheck.user) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();
    const body = await request.json();
    const { name, mobile, village, address, notes, photoUrl } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Farmer Name is required" }, { status: 400 });
    }

    if (!mobile?.trim()) {
      return NextResponse.json({ error: "Mobile Number is required" }, { status: 400 });
    }

    // Clean mobile digits
    const cleanedMobile = mobile.replace(/\D/g, "");
    if (cleanedMobile.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    if (!village?.trim()) {
      return NextResponse.json({ error: "Village is required" }, { status: 400 });
    }

    // Prevent accidental duplicate farmer registration with same mobile
    const existingFarmer = await Farmer.findOne({
      mobile: cleanedMobile,
      isDeleted: false,
    });

    if (existingFarmer) {
      return NextResponse.json(
        {
          error: `Farmer with mobile number ${cleanedMobile} is already registered (${existingFarmer.name}, ${existingFarmer.village}).`,
        },
        { status: 409 }
      );
    }

    const farmerId = await generateUniqueFarmerId();

    const newFarmer = await Farmer.create({
      farmerId,
      name: name.trim(),
      mobile: cleanedMobile,
      village: village.trim(),
      address: address?.trim() || "",
      notes: notes?.trim() || "",
      photoUrl: photoUrl || "",
      createdBy: authCheck.user.userId,
      isDeleted: false,
    });

    await logActivity({
      userId: authCheck.user.userId,
      action: "CREATE_FARMER",
      module: "Farmer",
      recordId: newFarmer.farmerId,
      description: `Registered farmer ${newFarmer.name} (${newFarmer.village}) with mobile ${newFarmer.mobile}.`,
    });

    return NextResponse.json({
      success: true,
      farmer: newFarmer,
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/farmers error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to register farmer" },
      { status: 500 }
    );
  }
}
