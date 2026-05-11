import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { Role } from "@/types/db";

const PUBLIC_PATH_PREFIXES = ["/api/auth", "/_next"];
const PUBLIC_PATHS = ["/", "/login", "/favicon.ico"];

const PROTECTED_APP_PATHS = [
  "/dashboard",
  "/setup",
  "/accounts",
  "/wallet",
  "/qc",
  "/submit",
  "/admin",
];

const QC_ALLOWED_ROLES: Role[] = ["team_lead", "admin"];
const ADMIN_ALLOWED_ROLES: Role[] = ["admin"];

function withPathnameHeader(req: Request, pathname: string) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublicPath =
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p));

  if (isPublicPath) return withPathnameHeader(req, pathname);

  const isProtectedAppPath = PROTECTED_APP_PATHS.some((p) =>
    pathname.startsWith(p)
  );
  if (!isProtectedAppPath) return withPathnameHeader(req, pathname);

  const session = req.auth;
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const role = (session.user?.role ?? "employee") as Role;

  if (pathname.startsWith("/qc") && !QC_ALLOWED_ROLES.includes(role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && !ADMIN_ALLOWED_ROLES.includes(role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return withPathnameHeader(req, pathname);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|login).*)"],
};
