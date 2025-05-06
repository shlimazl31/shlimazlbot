import { NextResponse } from "next/server";

// Müzik durumunu saklamak için basit bir bellek deposu
let musicStates: { [key: string]: any } = {};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get('guildId');

  if (!guildId) {
    return NextResponse.json({ error: "Guild ID is required" }, { status: 400 });
  }

  // Eğer sunucu için müzik durumu yoksa, boş veri döndür
  if (!musicStates[guildId]) {
    musicStates[guildId] = {
      isPlaying: false,
      currentTrack: null,
      queue: [],
      volume: 100
    };
  }

  return NextResponse.json(musicStates[guildId]);
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get('guildId');

  if (!guildId) {
    return NextResponse.json({ error: "Guild ID is required" }, { status: 400 });
  }

  const body = await request.json();
  const { action, value } = body;

  // Müzik durumunu güncelle
  if (!musicStates[guildId]) {
    musicStates[guildId] = {
      isPlaying: false,
      currentTrack: null,
      queue: [],
      volume: 100
    };
  }

  switch (action) {
    case 'pause':
      musicStates[guildId].isPlaying = false;
      break;
    case 'resume':
      musicStates[guildId].isPlaying = true;
      break;
    case 'skip':
      if (musicStates[guildId].queue.length > 0) {
        musicStates[guildId].currentTrack = musicStates[guildId].queue.shift();
      } else {
        musicStates[guildId].currentTrack = null;
        musicStates[guildId].isPlaying = false;
      }
      break;
    case 'volume':
      musicStates[guildId].volume = value;
      break;
    case 'update':
      // Bot'tan gelen güncelleme
      musicStates[guildId] = {
        ...musicStates[guildId],
        ...value
      };
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ success: true, state: musicStates[guildId] });
} 