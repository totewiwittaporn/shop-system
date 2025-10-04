import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ✅ กำหนด path ที่ไม่ต้องตรวจสอบ token
const publicPaths = ["/login", "/register", "/_next", "/favicon.ico"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ข้ามการตรวจสอบถ้าเป็น public path
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // ✅ ดึง token จาก cookie หรือ localStorage (ฝั่ง server มองไม่เห็น localStorage)
  const token = req.cookies.get("token")?.value;

  if (!token) {
    // ถ้าไม่มี token → redirect ไป login
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // ปล่อยให้ผ่านถ้ามี token
  return NextResponse.next();
}

// ✅ กำหนดว่า middleware จะทำงานกับ path ไหนบ้าง
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)", // ตรวจทุก path ยกเว้น api, static, image
  ],
};
