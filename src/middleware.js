import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Create the i18n middleware
const intlMiddleware = createMiddleware(routing);

export function middleware(req) {
  // Apply internationalization first
  const response = intlMiddleware(req);

  // Only apply API key for API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const requestHeaders = new Headers(req.headers);

    // Set API key if not already present
    if (!requestHeaders.has("api-key")) {
      requestHeaders.set("api-key", process.env.DATA_API_KEY || "");
    }

    // Return a new response with updated headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return response;
}

// Updated matcher to include API routes
export const config = {
  matcher: ["/", "/(vi|fr|en)/:path*", "/api/:path*"], // Now applies to API routes too
};
