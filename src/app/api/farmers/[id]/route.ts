import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Farmer from "@/models/Farmer";
import AIRecord from "@/models/AIRecord";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";

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

    // Search by ObjectId or farmerId
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const farmer = await Farmer.findOne({
      ...(isObjectId ? { _id: id } : { farmerId: id }),
      isDeleted: false,
    }).populate("createdBy", "name email role");

    if (!farmer) {
      return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
    }

    // Fetch all associated cow AI records with complete follow-up history
    const aiRecords = await AIRecord.find({
      farmerId: farmer._id,
      isDeleted: false,
    }).sort({ aiDate: -1 });

    const totalAI = aiRecords.length;
    const pregnantCows = aiRecords.filter((r) => r.pdStatus === "Pregnant").length;
    const pendingPD = aiRecords.filter((r) => r.pdStatus === "Pending").length;
    const calvingRecords = aiRecords.filter((r) => Boolean(r.calvingDate)).length;

    return NextResponse.json({
      farmer,
      stats: {
        totalAI,
        pregnantCows,
        pendingPD,
        calvingRecords,
      },
      aiRecords,
    });
  } catch (error: any) {
    console.error("GET /api/farmers/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch farmer details" },
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
    const { name, mobile, village, address, notes, photoUrl } = body;

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const farmer = await Farmer.findOne({
      ...(isObjectId ? { _id: id } : { farmerId: id }),
      isDeleted: false,
    });

    if (!farmer) {
      return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
    }

    // Validate mobile uniqueness if changed
    if (mobile) {
      const cleanedMobile = mobile.replace(/\D/g, "");
      if (cleanedMobile.length < 10) {
        return NextResponse.json(
          { error: "Please enter a valid 10-digit mobile number" },
          { status: 400 }
        );
      }

      if (cleanedMobile !== farmer.mobile) {
        const existing = await Farmer.findOne({
          mobile: cleanedMobile,
          _id: { $ne: farmer._id },
          isDeleted: false,
        });
        if (existing) {
          return NextResponse.json(
            { error: `Another farmer (${existing.name}) already has mobile number ${cleanedMobile}` },
            { status: 409 }
          );
        }
        farmer.mobile = cleanedMobile;
      }
    }

    if (name) farmer.name = name.trim();
    if (village) farmer.village = village.trim();
    if (address !== undefined) farmer.address = address?.trim() || "";
    if (notes !== undefined) farmer.notes = notes?.trim() || "";
    if (photoUrl !== undefined) farmer.photoUrl = photoUrl;

    await farmer.save();

    await logActivity({
      userId: authCheck.user.userId,
      action: "UPDATE_FARMER",
      module: "Farmer",
      recordId: farmer.farmerId,
      description: `Updated farmer details for ${farmer.name} (${farmer.farmerId}).`,
    });

    return NextResponse.json({ success: true, farmer });
  } catch (error: any) {
    console.error("PUT /api/farmers/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update farmer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only Admin can delete farmers
    const authCheck = requireAuth(request, ["admin"]);
    if (!authCheck.user) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();
    const { id } = params;

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const farmer = await Farmer.findOne({
      ...(isObjectId ? { _id: id } : { farmerId: id }),
      isDeleted: false,
    });

    if (!farmer) {
      return NextResponse.json({ error: "Farmer not found" }, { status: 404 });
    }

    // Business Logic: Soft delete farmer so related historical AI records are preserved safely
    farmer.isDeleted = true;
    await farmer.save();

    await logActivity({
      userId: authCheck.user.userId,
      action: "DELETE_FARMER",
      module: "Farmer",
      recordId: farmer.farmerId,
      description: `Admin safely soft-deleted farmer ${farmer.name} (${farmer.farmerId}). Historical AI records preserved.`,
    });

    return NextResponse.json({
      success: true,
      message: `Farmer ${farmer.name} has been safely removed. AI records remain archived in system.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/farmers/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete farmer" },
      { status: 500 }
    );
  }
}
