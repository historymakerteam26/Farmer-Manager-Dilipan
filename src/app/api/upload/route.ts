import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const authCheck = requireAuth(request);
    if (!authCheck.user) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { image, folder } = await request.json();
    if (!image) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    const url = await uploadImage(image, folder || "farmer-crm");

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
