import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { tryRefreshToken, setAuthCookies } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshTokenValue = cookieStore.get("refreshToken")?.value || "";

    if (!refreshTokenValue) {
      return NextResponse.json(
        { success: false, message: "No refresh token" },
        { status: 401 }
      );
    }

    const result = await tryRefreshToken(refreshTokenValue);

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Refresh failed" },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      { success: true, data: { token: result.token } },
      { status: 200 }
    );
    setAuthCookies(response, result.token, result.refreshToken);
    return response;
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Error" },
      { status: 500 }
    );
  }
}
