'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

interface MusicState {
  isPlaying: boolean;
  currentTrack: {
    title: string;
    author: string;
    duration: number;
    thumbnail: string;
  } | null;
  queue: Array<{
    title: string;
    author: string;
    duration: number;
    thumbnail: string;
  }>;
  volume: number;
}

export default function Home() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin');
    },
  });

  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [musicState, setMusicState] = useState<MusicState>({
    isPlaying: false,
    currentTrack: null,
    queue: [],
    volume: 100,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuilds = async () => {
      try {
        const response = await fetch('/api/guilds');
        if (!response.ok) throw new Error('Failed to fetch guilds');
        const data = await response.json();
        setGuilds(data);
      } catch (error) {
        console.error('Error fetching guilds:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchGuilds();
    }
  }, [session]);

  useEffect(() => {
    const fetchMusicState = async () => {
      if (!selectedGuild) return;

      try {
        const response = await fetch(`/api/music/${selectedGuild.id}`);
        if (!response.ok) throw new Error('Failed to fetch music state');
        const data = await response.json();
        setMusicState(data);
      } catch (error) {
        console.error('Error fetching music state:', error);
      }
    };

    fetchMusicState();
    const interval = setInterval(fetchMusicState, 1000); // Her saniye güncelle
    return () => clearInterval(interval);
  }, [selectedGuild]);

  const handleMusicControl = async (action: string, value?: any) => {
    if (!selectedGuild) return;

    try {
      const response = await fetch(`/api/music/${selectedGuild.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, value }),
      });

      if (!response.ok) throw new Error('Failed to control music');
      
      const data = await response.json();
      setMusicState(data.state);
    } catch (error) {
      console.error('Error controlling music:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          {session.user?.image && (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">Hoş Geldin, {session.user?.name}!</h1>
            <p className="text-gray-400">{session.user?.email}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sunucu Listesi */}
          <div className="bg-gray-800 p-6 rounded-lg col-span-full">
            <h2 className="text-xl font-semibold mb-4">Sunucularım</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {guilds.map((guild) => (
                <div
                  key={guild.id}
                  className={`bg-gray-700 p-4 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${
                    selectedGuild?.id === guild.id ? 'ring-2 ring-[#5865F2]' : 'hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedGuild(guild)}
                >
                  {guild.icon ? (
                    <img
                      src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                      alt={guild.name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                      {guild.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{guild.name}</h3>
                    <p className="text-sm text-gray-400">
                      {guild.owner ? 'Sunucu Sahibi' : 'Üye'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Müzik Kontrolü */}
          {selectedGuild && (
            <div className="bg-gray-800 p-6 rounded-lg col-span-full">
              <h2 className="text-xl font-semibold mb-4">Müzik Kontrolü - {selectedGuild.name}</h2>
              
              {/* Şu an çalan şarkı */}
              {musicState.currentTrack ? (
                <div className="bg-gray-700 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={musicState.currentTrack.thumbnail}
                      alt={musicState.currentTrack.title}
                      className="w-16 h-16 rounded"
                    />
                    <div>
                      <h3 className="font-medium">{musicState.currentTrack.title}</h3>
                      <p className="text-sm text-gray-400">{musicState.currentTrack.author}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 mb-4">Şu anda çalan şarkı yok.</p>
              )}

              {/* Kontroller */}
              <div className="flex items-center gap-4 mb-4">
                <button
                  className="bg-[#5865F2] text-white px-4 py-2 rounded hover:bg-[#4752C4] transition-colors"
                  onClick={() => handleMusicControl(musicState.isPlaying ? 'pause' : 'resume')}
                >
                  {musicState.isPlaying ? 'Duraklat' : 'Oynat'}
                </button>
                <button
                  className="bg-[#5865F2] text-white px-4 py-2 rounded hover:bg-[#4752C4] transition-colors"
                  onClick={() => handleMusicControl('skip')}
                >
                  Sonraki
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Ses:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={musicState.volume}
                    onChange={(e) => handleMusicControl('volume', parseInt(e.target.value))}
                    className="w-32"
                  />
                </div>
              </div>

              {/* Sıra */}
              <div>
                <h3 className="font-medium mb-2">Sıradaki Şarkılar</h3>
                <div className="space-y-2">
                  {musicState.queue.map((track, index) => (
                    <div
                      key={index}
                      className="bg-gray-700 p-3 rounded flex items-center gap-3"
                    >
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-12 h-12 rounded"
                      />
                      <div>
                        <h4 className="font-medium">{track.title}</h4>
                        <p className="text-sm text-gray-400">{track.author}</p>
                      </div>
                    </div>
                  ))}
                  {musicState.queue.length === 0 && (
                    <p className="text-gray-400">Sırada şarkı yok.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Kullanıcı Yönetimi */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Kullanıcı Yönetimi</h2>
            <p className="text-gray-400">Yakında...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
