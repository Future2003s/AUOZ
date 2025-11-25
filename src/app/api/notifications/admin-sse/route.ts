import { NextRequest } from "next/server";
import { envConfig } from "@/config";
import { getAuthHeaderOrRefresh } from "@/lib/next-api-auth";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

export async function GET(request: NextRequest) {
  const { authHeader } = await getAuthHeaderOrRefresh(request);
  if (!authHeader) {
    return new Response(JSON.stringify({ message: "Unauthenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const upstreamUrl = `${envConfig.NEXT_PUBLIC_API_END_POINT}/orders/stream`;
  const controller = new AbortController();
  const upstream = await fetch(upstreamUrl, {
    method: "GET",
    headers: {
      Authorization: authHeader,
      Accept: "text/event-stream",
    },
    cache: "no-store",
    signal: controller.signal,
  }).catch((error: unknown) => {
    controller.abort();
    throw error;
  });

  if (!upstream.ok || !upstream.body) {
    controller.abort();
    const upstreamBody = await upstream.text().catch(() => "");
    return new Response(
      JSON.stringify({
        message: "Failed to open upstream SSE",
        upstream: upstreamBody || undefined,
      }),
      {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const reader = upstream.body.getReader();

  const forwardStream = async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value);
      }
      await writer.close();
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error("Upstream SSE forwarding failed");
      await writer.abort(err);
    } finally {
      controller.abort();
    }
  };

  forwardStream();

  request.signal.addEventListener("abort", () => {
    controller.abort();
    reader.cancel().catch(() => {});
  });

  return new Response(readable, {
    status: 200,
    headers: SSE_HEADERS,
  });
}

