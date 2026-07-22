import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, resetToken, newPassword } = await req.json();

    if (!email || !resetToken || !newPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const result = await pool.query(
      "SELECT * FROM otps WHERE email = $1 AND code = $2 AND used = false ORDER BY id DESC LIMIT 1",
      [email, `reset:${resetToken}`]
    );
    const otp = result.rows[0];

    if (!otp) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    if (new Date(otp.expires_at) < new Date()) {
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, email]);
    await pool.query("UPDATE otps SET used = true WHERE email = $1 AND code = $2 AND used = false", [email, `reset:${resetToken}`]);

    return NextResponse.json({ message: "Password reset successful" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
