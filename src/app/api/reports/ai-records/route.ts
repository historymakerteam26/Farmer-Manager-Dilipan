import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import connectToDatabase from "@/lib/mongodb";
import AIRecord from "@/models/AIRecord";
import Farmer from "@/models/Farmer";
import { requireAuth } from "@/lib/auth";
import { formatDateIndian } from "@/lib/utils";
import { addDays } from "date-fns";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
  try {
    const authCheck = requireAuth(request);
    if (!authCheck.user) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const formatType = searchParams.get("format") || "excel"; // "excel" | "csv"
    const pdStatus = searchParams.get("pdStatus");
    const village = searchParams.get("village");

    const query: any = { isDeleted: false };
    if (pdStatus && pdStatus !== "all") query.pdStatus = pdStatus;

    if (village && village !== "all") {
      const farmersInVillage = await Farmer.find({ village, isDeleted: false }).select("_id");
      query.farmerId = { $in: farmersInVillage.map((f) => f._id) };
    }

    const records = await AIRecord.find(query)
      .populate("farmerId", "name mobile village farmerId")
      .sort({ aiDate: -1 })
      .lean();

    if (formatType === "csv") {
      const headers = [
        "AI Record ID",
        "Farmer Name",
        "Mobile Number",
        "Village",
        "Cattle Type",
        "Cow ID / Tag",
        "Cow Name",
        "Cow Breed",
        "Attempt Number",
        "AI Date",
        "Remark & Observation on AI",
        "Semen Breed",
        "Bull Name",
        "Straw Code",
        "Heat Check Date",
        "Heat Result",
        "PD Date",
        "PD Status",
        "Expected Calving Date (283d)",
        "Calving Date",
        "Remarks",
      ];

      const csvRows = [headers.join(",")];

      records.forEach((rec: any) => {
        const f = rec.farmerId || {};
        const row = [
          `"${rec.aiRecordId || ""}"`,
          `"${(f.name || "").replace(/"/g, '""')}"`,
          `"${f.mobile || ""}"`,
          `"${(f.village || "").replace(/"/g, '""')}"`,
          `"${rec.cattleType || "Cow"}"`,
          `"${rec.cowId || ""}"`,
          `"${(rec.cowName || "").replace(/"/g, '""')}"`,
          `"${(rec.cowBreed || "").replace(/"/g, '""')}"`,
          `"Attempt ${rec.attemptNumber || 1}"`,
          `"${formatDateIndian(rec.aiDate)}"`,
          `"${(rec.aiRemarks || "").replace(/"/g, '""')}"`,
          `"${(rec.semenBreed || "").replace(/"/g, '""')}"`,
          `"${(rec.bullName || "").replace(/"/g, '""')}"`,
          `"${(rec.strawCode || "").replace(/"/g, '""')}"`,
          `"${formatDateIndian(rec.heatCheckDate)}"`,
          `"${rec.heatResult || ""}"`,
          `"${formatDateIndian(rec.pdDate)}"`,
          `"${rec.pdStatus || ""}"`,
          `"${formatDateIndian(rec.expectedCalvingDate || (rec.aiDate ? addDays(new Date(rec.aiDate), 283) : undefined))}"`,
          `"${formatDateIndian(rec.calvingDate)}"`,
          `"${(rec.remarks || "").replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = csvRows.join("\r\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=ai-records-${new Date().toISOString().slice(0, 10)}.csv`,
        },
      });
    }

    // Excel Export using ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Farmer Manager CRM";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("AI Records Report", {
      views: [{ showGridLines: true }],
    });

    // Styling header
    worksheet.columns = [
      { header: "AI Record ID", key: "aiRecordId", width: 22 },
      { header: "Farmer Name", key: "farmerName", width: 24 },
      { header: "Mobile", key: "mobile", width: 16 },
      { header: "Village", key: "village", width: 18 },
      { header: "Cattle Type", key: "cattleType", width: 14 },
      { header: "Cow Tag / ID", key: "cowId", width: 18 },
      { header: "Cow Name", key: "cowName", width: 16 },
      { header: "Cow Breed", key: "cowBreed", width: 18 },
      { header: "Attempt Number", key: "attemptNumber", width: 16 },
      { header: "AI Date", key: "aiDate", width: 14 },
      { header: "Remark & Observation on AI", key: "aiRemarks", width: 30 },
      { header: "Semen Breed", key: "semenBreed", width: 18 },
      { header: "Bull Name", key: "bullName", width: 20 },
      { header: "Straw Code", key: "strawCode", width: 16 },
      { header: "Heat Check Date", key: "heatDate", width: 16 },
      { header: "Heat Result", key: "heatResult", width: 16 },
      { header: "PD Date", key: "pdDate", width: 14 },
      { header: "PD Status", key: "pdStatus", width: 16 },
      { header: "Expected Calving (283d)", key: "expectedCalvingDate", width: 20 },
      { header: "Calving Date", key: "calvingDate", width: 14 },
      { header: "Remarks", key: "remarks", width: 30 },
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF166534" }, // Primary Dark Green #166534
    };
    headerRow.height = 28;
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    records.forEach((rec: any) => {
      const f = rec.farmerId || {};
      const row = worksheet.addRow({
        aiRecordId: rec.aiRecordId || "",
        farmerName: f.name || "",
        mobile: f.mobile || "",
        village: f.village || "",
        cattleType: rec.cattleType || "Cow",
        cowId: rec.cowId || "",
        cowName: rec.cowName || "",
        cowBreed: rec.cowBreed || "",
        attemptNumber: `Attempt ${rec.attemptNumber || 1}`,
        aiDate: formatDateIndian(rec.aiDate),
        aiRemarks: rec.aiRemarks || "",
        semenBreed: rec.semenBreed || "",
        bullName: rec.bullName || "",
        strawCode: rec.strawCode || "",
        heatDate: formatDateIndian(rec.heatCheckDate),
        heatResult: rec.heatResult || "",
        pdDate: formatDateIndian(rec.pdDate),
        pdStatus: rec.pdStatus || "",
        expectedCalvingDate: formatDateIndian(rec.expectedCalvingDate || (rec.aiDate ? addDays(new Date(rec.aiDate), 283) : undefined)),
        calvingDate: formatDateIndian(rec.calvingDate),
        remarks: rec.remarks || "",
      });

      // Conditional color on PD Status
      const pdCell = row.getCell("pdStatus");
      if (rec.pdStatus === "Pregnant") {
        pdCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFDCFCE7" },
        };
        pdCell.font = { color: { argb: "FF166534" }, bold: true };
      } else if (rec.pdStatus === "Not Pregnant" || rec.pdStatus === "Failed") {
        pdCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFEE2E2" },
        };
        pdCell.font = { color: { argb: "FFDC2626" }, bold: true };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=Farmer_AI_Records_${new Date().toISOString().slice(0, 10)}.xlsx`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/reports/ai-records error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to export AI records" },
      { status: 500 }
    );
  }
}
