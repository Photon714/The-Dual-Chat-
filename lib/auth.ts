import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(  //converts normal string to digital bytes
  process.env.JWT_SECRET || "dualchat-secret-key-change-in-production"
);

const COOKIE_NAME = "dualchat-token";

export interface UserPayload {  //The data that is to be stored in token
  id: number;
  email: string;
  username: string;
}

export async function signToken(payload: UserPayload): Promise<string> { //will return string
  return new SignJWT(payload as unknown as Record<string, unknown>) //creating the jwt using payload, secret, header
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as UserPayload;
  } catch {
    return null;
  }
}

//making cookie so that even after refreshing the user wont need to auth again and the cookie with auth data will persist in the browser

export async function setAuthCookie(payload: UserPayload) {
  const token = await signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true, //making cookie connection
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
