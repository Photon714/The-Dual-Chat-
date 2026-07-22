import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and OTP code are required" }, { status: 400 });
    }

    const result = await pool.query(
      "SELECT * FROM otps WHERE email = $1 AND code = $2 AND used = false ORDER BY id DESC LIMIT 1", //sending the email and otp finding it in the db else invalid otp 
      [email, code]
    );
    const otp = result.rows[0]; //storing otp if found

    if (!otp) {
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }

    if (new Date(otp.expires_at) < new Date()) {  //incase it expired
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    await pool.query("UPDATE otps SET used = true WHERE email = $1 AND code = $2 AND used = false", [email, code]); //marking the otp used

    const resetToken = Math.random().toString(36).substring(2, 15); // creating a reset token soas to reset passsword within a certain time with resettoken verification
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); //10 mins
    await pool.query("INSERT INTO otps (email, code, expires_at) VALUES ($1, $2, $3)", [email, `reset:${resetToken}`, expiresAt]); //inserting the reset token into the db 

    return NextResponse.json({ message: "OTP verified", resetToken });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
