import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (user) {
    await logActivity({
      userId: user.userId,
      action: "USER_LOGOUT",
      module: "Auth",
      description: `User ${user.name} logged out.`,
    });
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
