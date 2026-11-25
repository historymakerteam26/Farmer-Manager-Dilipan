import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { UserRole } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "farmer_crm_jwt_secret_super_secure_key_2025_9999";
export const AUTH_COOKIE_NAME = "farmer_crm_session";

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function getUserFromRequest(request: NextRequest): TokenPayload | null {
  // 1. Check Cookie
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieToken) {
    const verified = verifyToken(cookieToken);
    if (verified) return verified;
  }

  // 2. Check Authorization Header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const headerToken = authHeader.substring(7);
    const verified = verifyToken(headerToken);
    if (verified) return verified;
  }

  return null;
}

export function requireAuth(
  request: NextRequest,
  allowedRoles?: UserRole[]
): { user: TokenPayload | null; error?: string; status?: number } {
  const user = getUserFromRequest(request);
  if (!user) {
    return { user: null, error: "Unauthorized. Please log in.", status: 401 };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      user: null,
      error: `Forbidden. Role '${user.role}' lacks permission for this action.`,
      status: 403,
    };
  }

  return { user };
}
