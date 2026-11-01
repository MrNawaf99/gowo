import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { authenticateStudent } from "@/lib/services/studentAuthService";

const LoginRequestSchema = z.object({
  identifier: z.string().min(1, "Identifier is required").max(100),
  password: z.string().min(1, "Password is required").max(100),
});

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.FIREBASE_PROJECT_ID || "goword-academy-secure-secret-key-2026";

export function createSessionToken(student: { id: string; studentId: string; username: string; name: string }): string {
  const payload = {
    ...student,
    role: "student",
    issuedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): { id: string; studentId: string; username: string; name: string } | null {
  try {
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;
    const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (Date.now() > payload.expiresAt) return null;
    return {
      id: payload.id,
      studentId: payload.studentId,
      username: payload.username,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }
    const parsed = LoginRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;
    const authResult = await authenticateStudent(identifier, password);

    if (!authResult.success || !authResult.student) {
      return NextResponse.json(
        { ok: false, error: authResult.error || "Invalid student credentials." },
        { status: 401 }
      );
    }

    const token = createSessionToken(authResult.student);

    const response = NextResponse.json({
      ok: true,
      student: authResult.student,
    });

    response.cookies.set({
      name: "goword_student_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err) {
    console.error("Student login endpoint error:", err);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
