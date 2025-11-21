import { NextRequest } from "next/server";
import { envConfig } from "@/config";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  // Handle both Promise and direct object (Next.js 13+ vs 15+)
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = resolvedParams?.id as string;

  console.log("Product detail API called for ID:", id);

  if (!id) {
    return new Response(
      JSON.stringify({
        data: null,
        message: "Product ID is required",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const base =
      envConfig.NEXT_PUBLIC_API_END_POINT ||
      `${envConfig.NEXT_PUBLIC_BACKEND_URL}/api/${envConfig.NEXT_PUBLIC_API_VERSION}`;
    const backendUrl = `${base}/products/${id}`;
    console.log("Backend URL:", backendUrl);

    const res = await fetch(backendUrl, { cache: "no-store" });
    console.log("Product detail API response status:", res.status);

    if (!res.ok) {
      console.error("Product detail API error - status:", res.status);
      const errorText = await res.text().catch(() => "");
      return new Response(
        JSON.stringify({
          data: null,
          message: errorText || "Product not found",
        }),
        {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let raw: any = null;
    try {
      const text = await res.text();
      raw = text ? JSON.parse(text) : null;
    } catch (error) {
      console.error("JSON parse error:", error);
      raw = null;
    }
    console.log("Product detail API raw response:", raw);

    // Normalize product data: support raw object or wrapped formats
    let productData: any = null;
    if (raw && typeof raw === "object") {
      if ("success" in raw && raw.success && raw.data) {
        productData = raw.data;
      } else if (
        raw.data &&
        typeof raw.data === "object" &&
        !Array.isArray(raw.data)
      ) {
        productData = raw.data;
      } else if (raw.product && typeof raw.product === "object") {
        productData = raw.product;
      } else if (raw._id || raw.id || raw.name) {
        productData = raw; // raw product object
      }
    }

    console.log("Product detail normalized data:", productData);

    return new Response(JSON.stringify({ data: productData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Product detail API error:", e);
    return new Response(
      JSON.stringify({ data: null, message: "Internal Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
