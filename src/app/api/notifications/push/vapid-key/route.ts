import { NextResponse } from "next/server";

// VAPID public key - In production, this should come from environment variables
// For now, we'll use a placeholder. You need to generate VAPID keys using:
// npm install -g web-push
// web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
  "BEl62iUYgUivxIkv69yViEuiBIa40HIe8F5jBkUvHCFL6r7fn9xfGsBX6vJKonEtgonilC7J9On3LP3TaFDsKI";

export async function GET() {
  return NextResponse.json({ publicKey: VAPID_PUBLIC_KEY });
}
