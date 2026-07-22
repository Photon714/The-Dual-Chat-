import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return NextResponse.json({ message: "If an account exists with this email, an OTP has been sent." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); //coverts date into string 

    await pool.query("UPDATE otps SET used = true WHERE email = $1 AND used = false", [email]); // all the previous otps are marked used except the curr one being not used ie set false
    await pool.query("INSERT INTO otps (email, code, expires_at) VALUES ($1, $2, $3)", [email, code, expiresAt]);

    console.log(`\n  OTP for ${email}: ${code}\n`); //fn sending to console

    return NextResponse.json({ message: "If an account exists with this email, an OTP has been sent." });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
