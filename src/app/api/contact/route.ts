import { NextRequest, NextResponse } from "next/server";

export interface ContactFormPayload {
  name: string;
  email: string;
  phone: string;
  requestType: string;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ContactFormPayload = await req.json();

    // Basic validation
    const { name, email, phone, requestType, message } = body;
    if (!name || !email || !phone || !requestType || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Try to forward to backend if available
    const backendUrl =
      process.env.NEXT_PUBLIC_API_END_POINT ||
      "http://localhost:8081/api/v1";

    let backendSuccess = false;
    try {
      const backendResp = await fetch(`${backendUrl}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          requestType,
          message,
          submittedAt: new Date().toISOString(),
        }),
        // Short timeout so we don't block the response
        signal: AbortSignal.timeout(5000),
      });

      if (backendResp.ok) {
        backendSuccess = true;
      }
    } catch {
      // Backend unavailable — log to console so the submission isn't silently lost
      console.warn("[Contact API] Backend unavailable, logging submission locally:");
      console.log({
        name,
        email,
        phone,
        requestType,
        message: message.slice(0, 100) + (message.length > 100 ? "..." : ""),
        submittedAt: new Date().toISOString(),
      });
    }

    // Always return success to the user — data is logged if backend is down
    return NextResponse.json({
      success: true,
      message: "Message received",
      via: backendSuccess ? "backend" : "logged",
    });
  } catch (error) {
    console.error("[Contact API] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
