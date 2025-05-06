import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch guilds");
    }

    const guilds = await response.json();
    return NextResponse.json(guilds);
  } catch (error) {
    console.error("Error fetching guilds:", error);
    return NextResponse.json(
      { error: "Failed to fetch guilds" },
      { status: 500 }
    );
  }
} 