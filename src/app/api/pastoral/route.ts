import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

const baseUrl =
    envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    return proxyJson(`${baseUrl}/pastoral${url.search}`, request, {
        method: "GET",
    });
}

export async function POST(request: NextRequest) {
    const body = await request.text();
    return proxyJson(`${baseUrl}/pastoral`, request, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        requireAuth: true,
    });
}
