import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/?spotify=error", req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?spotify=error", req.url));
  }

  // Redirect back to the app with the code — token exchange happens client-side (PKCE)
  return NextResponse.redirect(new URL(`/?spotify_code=${code}`, req.url));
}
