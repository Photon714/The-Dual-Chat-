import { NextResponse } from "next/server";
import pool from "@/lib/db";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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

    await pool.query("UPDATE otps SET used = true WHERE email = $1 AND used = false", [email]);
    await pool.query("INSERT INTO otps (email, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes')", [email, code]);

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Your Dual Chat OTP Code",
      html: `<p>Your OTP code is: <strong>${code}</strong></p><p>It expires in 10 minutes.</p>`,
    });

    return NextResponse.json({ message: "If an account exists with this email, an OTP has been sent." });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
