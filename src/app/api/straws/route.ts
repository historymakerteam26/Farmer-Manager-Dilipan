import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import StrawStock from "@/models/StrawStock";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";

const DEFAULT_STRAWS = [
  { strawTitle: "HF", strawCount: 500, bullNumber: "HF-IND-01", description: "Holstein Friesian" },
  { strawTitle: "Jy", strawCount: 300, bullNumber: "JY-TN-22", description: "Jersey High Yield" },
  { strawTitle: "94100(CFS)", strawCount: 50, bullNumber: "CFS-94100", description: "CFS Proven Bull" },
  { strawTitle: "CBHF", strawCount: 100, bullNumber: "CBHF-504", description: "Cross Breed HF" },
  { strawTitle: "GIR", strawCount: 10, bullNumber: "GIR-GUJ-11", description: "Indigenous Gir" },
  { strawTitle: "KANGAYAM", strawCount: 20, bullNumber: "KG-TN-09", description: "Native Kangayam" },
];

export async function GET(request: NextRequest) {
  try {
    const authCheck = requireAuth(request);
    if (!authCheck.user) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();

    let straws = await StrawStock.find({ isDeleted: false }).sort({ strawTitle: 1 });

    // Auto-seed default straw items matching user's register if completely empty
    if (straws.length === 0) {
      await StrawStock.insertMany(DEFAULT_STRAWS);
      straws = await StrawStock.find({ isDeleted: false }).sort({ strawTitle: 1 });
    }

    const totalCount = straws.reduce((acc, curr) => acc + (curr.strawCount || 0), 0);

    return NextResponse.json({
      success: true,
      straws,
      totalCount,
    });
  } catch (error: any) {
    console.error("GET /api/straws error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch straw stock" },
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

    const { strawTitle, strawCount, bullNumber, description } = body;

    if (!strawTitle?.trim()) {
      return NextResponse.json({ error: "Straw title/breed is required" }, { status: 400 });
    }

    const parsedCount = parseInt(strawCount, 10);
    if (isNaN(parsedCount) || parsedCount < 0) {
      return NextResponse.json({ error: "Valid straw count (>= 0) is required" }, { status: 400 });
    }

    // Check if straw title already exists
    const existing = await StrawStock.findOne({
      strawTitle: { $regex: new RegExp(`^${strawTitle.trim()}$`, "i") },
      isDeleted: false,
    });

    if (existing) {
      return NextResponse.json(
        { error: `Straw with title '${strawTitle.trim()}' already exists. Please edit its stock count instead.` },
        { status: 400 }
      );
    }

    const newStraw = await StrawStock.create({
      strawTitle: strawTitle.trim(),
      strawCount: parsedCount,
      bullNumber: bullNumber?.trim() || "",
      description: description?.trim() || "",
      isActive: true,
      isDeleted: false,
    });

    await logActivity({
      userId: authCheck.user.userId,
      action: "CREATE_STRAW_STOCK",
      module: "StrawStock",
      recordId: newStraw._id.toString(),
      description: `Added new straw stock '${newStraw.strawTitle}' with count ${newStraw.strawCount}.`,
    });

    return NextResponse.json({ success: true, straw: newStraw }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/straws error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create straw stock item" },
      { status: 500 }
    );
  }
}
