import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
//This is a server side check runs before page loads
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dualchat-secret-key-change-in-production"
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("dualchat-token")?.value; //taking the jwt token from the cookie

  if (!token) {
    return NextResponse.redirect(new URL("/?auth=login", request.url));
  }

  try {
    await jwtVerify(token, SECRET); //matching if correct, referring to the content of the page
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/?auth=login", request.url)); //else redirecting to login page and deleting the cookie
    response.cookies.delete("dualchat-token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"], //a path selector for middleware to run on all pages except api, static, image etc
};
