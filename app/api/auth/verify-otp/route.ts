import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and OTP code are required" }, { status: 400 });
    }

    const result = await pool.query(
      "SELECT * FROM otps WHERE email = $1 AND code = $2 AND used = false AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
      [email, code]
    );
    const otp = result.rows[0];

    if (!otp) {
      return NextResponse.json({ error: "Invalid or expired OTP code" }, { status: 400 });
    }

    await pool.query("UPDATE otps SET used = true WHERE email = $1 AND code = $2 AND used = false", [email, code]);

    const resetToken = Math.random().toString(36).substring(2, 15);
    await pool.query("INSERT INTO otps (email, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes')", [email, `reset:${resetToken}`]);

    return NextResponse.json({ message: "OTP verified", resetToken });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
