import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

const baseUrl = envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    return proxyJson(`${baseUrl}/promo-widgets/${params.id}`, request, {
        method: "GET",
    });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    const body = await request.text();
    return proxyJson(`${baseUrl}/promo-widgets/${params.id}`, request, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
        requireAuth: true,
    });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    return proxyJson(`${baseUrl}/promo-widgets/${params.id}`, request, {
        method: "DELETE",
        requireAuth: true,
    });
}
