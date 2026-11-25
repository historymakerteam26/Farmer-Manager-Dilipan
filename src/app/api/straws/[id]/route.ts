import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import StrawStock from "@/models/StrawStock";
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

    const straw = await StrawStock.findOne({ _id: id, isDeleted: false });
    if (!straw) {
      return NextResponse.json({ error: "Straw stock item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, straw });
  } catch (error: any) {
    console.error("GET /api/straws/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch straw stock" },
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

    const straw = await StrawStock.findOne({ _id: id, isDeleted: false });
    if (!straw) {
      return NextResponse.json({ error: "Straw stock item not found" }, { status: 404 });
    }

    if (body.strawTitle !== undefined) {
      if (!body.strawTitle.trim()) {
        return NextResponse.json({ error: "Straw title cannot be empty" }, { status: 400 });
      }
      straw.strawTitle = body.strawTitle.trim();
    }

    // Direct count update or relative delta
    if (body.strawCount !== undefined) {
      const parsed = parseInt(body.strawCount, 10);
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json({ error: "Straw count must be >= 0" }, { status: 400 });
      }
      straw.strawCount = parsed;
    } else if (body.delta !== undefined) {
      const delta = parseInt(body.delta, 10);
      if (!isNaN(delta)) {
        straw.strawCount = Math.max(0, (straw.strawCount || 0) + delta);
      }
    }

    if (body.bullNumber !== undefined) straw.bullNumber = body.bullNumber?.trim() || "";
    if (body.description !== undefined) straw.description = body.description?.trim() || "";
    if (body.isActive !== undefined) straw.isActive = Boolean(body.isActive);

    await straw.save();

    await logActivity({
      userId: authCheck.user.userId,
      action: "UPDATE_STRAW_STOCK",
      module: "StrawStock",
      recordId: straw._id.toString(),
      description: `Updated straw stock '${straw.strawTitle}' (New count: ${straw.strawCount}).`,
    });

    return NextResponse.json({ success: true, straw });
  } catch (error: any) {
    console.error("PUT /api/straws/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update straw stock" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const straw = await StrawStock.findOne({ _id: id, isDeleted: false });
    if (!straw) {
      return NextResponse.json({ error: "Straw stock item not found" }, { status: 404 });
    }

    straw.isDeleted = true;
    await straw.save();

    await logActivity({
      userId: authCheck.user.userId,
      action: "DELETE_STRAW_STOCK",
      module: "StrawStock",
      recordId: straw._id.toString(),
      description: `Deleted straw stock item '${straw.strawTitle}'.`,
    });

    return NextResponse.json({ success: true, message: "Straw stock deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/straws/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete straw stock" },
      { status: 500 }
    );
  }
}
