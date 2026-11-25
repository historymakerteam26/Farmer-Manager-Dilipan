import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { comparePassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";
import { runDatabaseSeed } from "@/lib/seed-data";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Auto-seed default accounts on first login if no users exist
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await runDatabaseSeed();
    }

    const body = await request.json();
    const pin = (body.pin || body.password || "").toString().trim();
    const identifier = (body.username || body.email || "").toLowerCase().trim();

    // 1. Check for 4-digit PIN (2002)
    if (pin === "2002") {
      let admin = await User.findOne({
        $or: [
          { role: "admin" },
          { email: "gvinsemination@gmail.com" },
          { email: "inseminatormuni@gmail.com" },
          { username: "@admin" },
        ],
      });

      if (!admin) {
        await runDatabaseSeed();
        admin = await User.findOne({ role: "admin" });
      }

      if (admin) {
        admin.name = "Dilipan";
        admin.email = "gvinsemination@gmail.com";
        admin.username = "@admin";
        await admin.save();

        const token = signToken({
          userId: admin._id.toString(),
          email: admin.email,
          role: admin.role,
          name: admin.name,
        });

        await logActivity({
          userId: admin._id.toString(),
          action: "USER_LOGIN",
          module: "Auth",
          description: `Dilipan logged in via 4-digit PIN.`,
        });

        const response = NextResponse.json({
          success: true,
          user: {
            id: admin._id.toString(),
            name: admin.name,
            email: admin.email,
            role: admin.role,
          },
          token,
        });

        response.cookies.set(AUTH_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60,
          path: "/",
        });

        return response;
      }
    }

    // If only PIN was sent and not 2002
    if (!identifier && pin) {
      return NextResponse.json(
        { error: "Invalid 4-digit passcode. Please enter 2002." },
        { status: 401 }
      );
    }

    if (!identifier || !pin) {
      return NextResponse.json(
        { error: "4-digit passcode is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier },
        ...(identifier === "@admin" || identifier === "admin"
          ? [{ role: "admin" }, { email: "admin@farmer.com" }]
          : []),
      ],
    });
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account has been deactivated. Please contact the administrator." },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(pin, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.role === "admin") {
      user.name = "Dilipan";
      user.email = "gvinsemination@gmail.com";
      user.username = "@admin";
      await user.save();
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await logActivity({
      userId: user._id.toString(),
      action: "USER_LOGIN",
      module: "Auth",
      description: `User ${user.name} (${user.role}) logged in.`,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });

    // Set secure HTTP-only cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
