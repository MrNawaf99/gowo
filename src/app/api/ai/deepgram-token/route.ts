import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    
    if (!deepgramApiKey) {
      console.warn("DEEPGRAM_API_KEY is not set. Returning mock token for local development.");
      return NextResponse.json({ token: "MOCK_DEEPGRAM_TOKEN_FOR_DEV", mock: true });
    }

    const tokenRes = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {
        Authorization: `Token ${deepgramApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ttl_seconds: 600,
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("Deepgram auth/grant error response:", errorText);
      throw new Error(`Failed to generate Deepgram token: ${tokenRes.statusText} - Check API Key permissions`);
    }

    const tokenData = await tokenRes.json();
    return NextResponse.json({ token: tokenData.access_token });
    
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Deepgram token error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

