import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import connectToDatabase from "@/lib/mongodb";
import Farmer from "@/models/Farmer";
import { requireAuth } from "@/lib/auth";
import { formatDateIndian } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const authCheck = requireAuth(request);
    if (!authCheck.user) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const formatType = searchParams.get("format") || "csv";

    const farmers = await Farmer.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name")
      .lean();

    if (formatType === "csv") {
      const headers = [
        "Farmer ID",
        "Full Name",
        "Mobile Number",
        "Village",
        "Address",
        "Registration Date",
        "Registered By",
        "Notes",
      ];

      const csvRows = [headers.join(",")];

      farmers.forEach((farmer: any) => {
        const row = [
          `"${farmer.farmerId || ""}"`,
          `"${(farmer.name || "").replace(/"/g, '""')}"`,
          `"${farmer.mobile || ""}"`,
          `"${(farmer.village || "").replace(/"/g, '""')}"`,
          `"${(farmer.address || "").replace(/"/g, '""')}"`,
          `"${formatDateIndian(farmer.createdAt)}"`,
          `"${farmer.createdBy?.name || "System"}"`,
          `"${(farmer.notes || "").replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = csvRows.join("\r\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=farmers-export-${new Date().toISOString().slice(0, 10)}.csv`,
        },
      });
    }

    return NextResponse.json({ farmers });
  } catch (error: any) {
    console.error("GET /api/reports/farmers error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to export farmers" },
      { status: 500 }
    );
  }
}
