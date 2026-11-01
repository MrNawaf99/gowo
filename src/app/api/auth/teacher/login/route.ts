import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { authenticateTeacher } from "@/lib/services/teacherAuthService";

const LoginRequestSchema = z.object({
  username: z.string().min(1, "Username is required").max(100),
  password: z.string().min(1, "Password is required").max(100),
});

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.FIREBASE_PROJECT_ID || "goword-academy-secure-secret-key-2026";

export function createTeacherSessionToken(teacher: { id: string; username: string; name: string }): string {
  const payload = {
    ...teacher,
    role: "teacher",
    issuedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
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

    const { username, password } = parsed.data;
    const authResult = await authenticateTeacher(username, password);

    if (!authResult.success || !authResult.teacher) {
      return NextResponse.json(
        { ok: false, error: authResult.error || "Invalid teacher credentials." },
        { status: 401 }
      );
    }

    const token = createTeacherSessionToken(authResult.teacher);

    const response = NextResponse.json({
      ok: true,
      teacher: authResult.teacher,
    });

    response.cookies.set({
      name: "goword_teacher_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err) {
    console.error("Teacher login endpoint error:", err);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
