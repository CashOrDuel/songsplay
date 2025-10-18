import { useEffect, useState, useRef } from 'react';
import { SkipBack, Play, Pause, SkipForward, Upload, MessageSquare } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Album, Song } from './lib/supabase';
import UploadModal from './components/UploadModal';
import AdminNoteModal from './components/AdminNoteModal';

// Impor gambar lokal untuk cover album
import albumNormal from './assets/images/images (1).png';
import albumStrong from './assets/images/images (2).png';
import albumSlow from './assets/images/images (3).png';

export default function App() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [adminNoteModalOpen, setAdminNoteModalOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetchAlbums();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    if (currentAlbum) {
      fetchSongs(currentAlbum.id);
    }
  }, [currentAlbum]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const fetchAlbums = async () => {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .order('name');

    if (!error && data) {
      setAlbums(data);
      if (data.length > 0) {
        setCurrentAlbum(data[0]);
      }
    }
  };

  const fetchSongs = async (albumId: string) => {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('album_id', albumId)
      .order('order_index', { ascending: true });

    if (!error && data) {
      setSongs(data);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('songs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'songs',
        },
        (payload) => {
          const newSong = payload.new as Song;
          setSongs((prev) => [newSong, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const playTrack = (index: number) => {
    if (index < 0 || index >= songs.length) return;

    const song = songs[index];
    setCurrentSong(song);
    setCurrentIndex(index);

    if (audioRef.current) {
      audioRef.current.src = song.song_url;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (!currentSong && songs.length > 0) {
      playTrack(0);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const playPrevious = () => {
    if (currentIndex > 0) {
      playTrack(currentIndex - 1);
    } else if (songs.length > 0) {
      playTrack(songs.length - 1);
    }
  };

  const playNext = () => {
    if (currentIndex < songs.length - 1) {
      playTrack(currentIndex + 1);
    } else if (songs.length > 0) {
      playTrack(0);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    playNext();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (parseFloat(e.target.value) / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredSongs = currentAlbum
    ? songs.filter((s) => s.album_id === currentAlbum.id)
    : [];

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#e6eef8] flex items-center justify-center p-5">
      <div className="w-full max-w-[880px] bg-gradient-to-b from-[#071124] to-[#0b1630] rounded-xl p-5 shadow-2xl">
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => setAdminNoteModalOpen(true)}
            className="bg-[#0b2540] hover:bg-[#133d65] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <MessageSquare size={18} />
            Note
          </button>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="bg-[#1f6aa6] hover:bg-[#2a7bc4] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Upload size={18} />
            Upload
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-start gap-4">
          {/* --- BAGIAN YANG DIMODIFIKASI --- */}
          <div className="w-[120px] h-[120px] rounded-lg bg-[#122136] flex items-center justify-center overflow-hidden flex-shrink-0">
            {(() => {
              // Prioritaskan cover_url jika ada (untuk album yang diupload)
              if (currentAlbum?.cover_url) {
                return (
                  <img
                    src={currentAlbum.cover_url}
                    alt={currentAlbum.title}
                    className="w-full h-full object-cover"
                  />
                );
              }
              // Logika untuk album bawaan berdasarkan judul
              switch (currentAlbum?.title) {
                case 'Normal':
                  return <img src={albumNormal} alt="Normal Album" className="w-full h-full object-cover" />;
                case 'Strong':
                  return <img src={albumStrong} alt="Strong Album" className="w-full h-full object-cover" />;
                case 'Slow':
                  return <img src={albumSlow} alt="Slow Album" className="w-full h-full object-cover" />;
                // Placeholder jika tidak ada yang cocok
                default:
                  return <div className="text-4xl">🎵</div>;
              }
            })()}
          </div>
          {/* --- AKHIR BAGIAN YANG DIMODIFIKASI --- */}

          <div className="flex-1 w-full">
            <h1 className="text-lg font-semibold mb-1">
              Album: {currentAlbum?.title || 'Select Album'}
            </h1>
            <p className="text-[#9fb2d3] mb-3">
              {currentSong ? currentSong.title : 'Select a song to start'}
            </p>

            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={playPrevious}
                className="bg-[#0b2540] hover:bg-[#133d65] text-white px-3 py-2 rounded-lg transition-colors text-lg"
              >
                <SkipBack size={18} />
              </button>
              <button
                onClick={togglePlayPause}
                className="bg-[#0b2540] hover:bg-[#133d65] text-white px-4 py-3 rounded-lg transition-colors text-2xl font-semibold"
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} />}
              </button>
              <button
                onClick={playNext}
                className="bg-[#0b2540] hover:bg-[#133d65] text-white px-3 py-2 rounded-lg transition-colors text-lg"
              >
                <SkipForward size={18} />
              </button>

              <div className="flex-1" />

              <div className="flex items-center gap-2 text-sm text-[#9fb2d3]">
                <span>Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {albums.map((album) => (
                <button
                  key={album.id}
                  onClick={() => setCurrentAlbum(album)}
                  className={`px-3 py-2 rounded-lg transition-colors border ${
                    currentAlbum?.id === album.id
                      ? 'bg-[#123251] border-[#1f6aa6]'
                      : 'bg-transparent border-white/5 hover:bg-white/5'
                  }`}
                >
                  {album.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 bg-white/[0.02] p-3 rounded-lg max-h-[300px] overflow-y-auto">
          <div className="text-sm text-[#9fb2d3] mb-2">Song List</div>
          {filteredSongs.length === 0 ? (
            <div className="text-center text-[#9fb2d3] py-8">
              No songs in this album yet. Upload one!
            </div>
          ) : (
            filteredSongs.map((song, index) => (
              <div
                key={song.id}
                onClick={() => playTrack(index)}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                  currentSong?.id === song.id
                    ? 'bg-gradient-to-r from-[#145a96]/20 to-[#1478be]/10'
                    : 'hover:bg-white/[0.03]'
                }`}
              >
                <div>
                  <strong>{index + 1}.</strong> {song.title}
                </div>
                <div className="text-sm text-[#9fb2d3]">
                  {song.artist || 'Unknown Artist'}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-3">
          <input
            type="range"
            min="0"
            max="100"
            value={duration ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-sm text-[#9fb2d3]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <footer className="mt-4 text-right text-[#7ea3c7] text-sm">
          nikmati music bersama
        </footer>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        albums={albums}
      />

      <AdminNoteModal
        isOpen={adminNoteModalOpen}
        onClose={() => setAdminNoteModalOpen(false)}
      />
    </div>
  );
}