import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "../login/route";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("goword_student_session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ ok: true, authenticated: false });
    }

    const student = verifySessionToken(sessionCookie.value);
    if (!student) {
      return NextResponse.json({ ok: true, authenticated: false });
    }

    return NextResponse.json({
      ok: true,
      authenticated: true,
      student,
    });
  } catch (err) {
    console.error("Student session check error:", err);
    return NextResponse.json({ ok: true, authenticated: false });
  }
}
