import { NextRequest } from "next/server";
import { proxyJson } from "@/lib/next-api-auth";
import { envConfig } from "@/config";

export async function GET(request: NextRequest) {
  try {
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const url = new URL(`${baseUrl}/tasks`);
    
    // Forward query parameters
    const page = request.nextUrl.searchParams.get("page");
    const limit = request.nextUrl.searchParams.get("limit");
    const date = request.nextUrl.searchParams.get("date");
    const startDate = request.nextUrl.searchParams.get("startDate");
    const endDate = request.nextUrl.searchParams.get("endDate");
    const status = request.nextUrl.searchParams.get("status");
    const assignee = request.nextUrl.searchParams.get("assignee");
    const tag = request.nextUrl.searchParams.get("tag");
    
    if (page) url.searchParams.set("page", page);
    if (limit) url.searchParams.set("limit", limit);
    if (date) url.searchParams.set("date", date);
    if (startDate) url.searchParams.set("startDate", startDate);
    if (endDate) url.searchParams.set("endDate", endDate);
    if (status) url.searchParams.set("status", status);
    if (assignee) url.searchParams.set("assignee", assignee);
    if (tag) url.searchParams.set("tag", tag);

    const response = await proxyJson(url.toString(), request, {
      method: "GET",
      requireAuth: true,
    });

    return response;
  } catch (e) {
    console.error("Tasks API error:", e);
    return new Response(
      JSON.stringify({
        message: "Internal Error",
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const baseUrl =
      envConfig.NEXT_PUBLIC_API_END_POINT || "http://localhost:8081/api/v1";
    const body = await request.json();
    
    const response = await proxyJson(`${baseUrl}/tasks`, request, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      requireAuth: true,
    });

    return response;
  } catch (e) {
    console.error("Task creation error:", e);
    return new Response(
      JSON.stringify({
        message: "Internal Error",
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

