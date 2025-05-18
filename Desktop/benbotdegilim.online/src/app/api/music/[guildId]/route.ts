import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/auth";

const BOT_API_URL = "https://benbotdegilimbotu-production.up.railway.app";

export async function GET(
  request: Request,
  context: { params: { guildId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { guildId } = context.params;

    // Bot API'sinden müzik durumunu al
    const response = await fetch(`${BOT_API_URL}/api/bot/music?guildId=${guildId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch music state from bot");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching music state:", error);
    return NextResponse.json(
      { error: "Failed to fetch music state" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: { guildId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { guildId } = context.params;
    const body = await request.json();
    const { action, value } = body;

    // Bot API'sine komut gönder
    const response = await fetch(`${BOT_API_URL}/api/bot/music?guildId=${guildId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, value }),
    });

    if (!response.ok) {
      throw new Error("Failed to control music");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error controlling music:", error);
    return NextResponse.json(
      { error: "Failed to control music" },
      { status: 500 }
    );
  }
} 