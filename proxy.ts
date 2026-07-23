import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dualchat-secret-key-change-in-production"
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.next();
  }

  const token = request.cookies.get("dualchat-token")?.value;

  if (!token) {
    const loginUrl = new URL("/?auth=login", request.url);
    const response = NextResponse.redirect(loginUrl);
    const roomMatch = pathname.match(/^\/chat-User\/([^/]+)$/);
    if (roomMatch) {
      response.cookies.set("pending-room", roomMatch[1], { path: "/", maxAge: 300 });
    }
    return response;
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/?auth=login", request.url));
    response.cookies.delete("dualchat-token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
