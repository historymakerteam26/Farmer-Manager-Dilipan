import { NextRequest, NextResponse } from "next/server";
import { runDatabaseSeed } from "@/lib/seed-data";

export async function POST(request: NextRequest) {
  try {
    const result = await runDatabaseSeed();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Seed API failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to seed database" },
      { status: 500 }
    );
  }
}
