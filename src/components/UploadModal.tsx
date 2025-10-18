import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Album } from '../lib/supabase';

type UploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  albums: Album[];
};

export default function UploadModal({ isOpen, onClose, albums }: UploadModalProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !albumId || !file) {
      setError('Please fill all required fields');
      return;
    }

    if (!file.type.includes('audio')) {
      setError('Please select a valid MP3 file');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('songs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('songs')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('songs')
        .insert({
          title,
          artist: artist || null,
          album_id: albumId,
          song_url: publicUrl,
          order_index: Date.now(),
        });

      if (insertError) throw insertError;

      setTitle('');
      setArtist('');
      setAlbumId('');
      setFile(null);
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload song. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#071124] to-[#0b1630] rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upload Song</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Song Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0b2540] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#1f6aa6]"
              placeholder="Enter song title"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Artist Name</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full bg-[#0b2540] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#1f6aa6]"
              placeholder="Enter artist name"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Select Album <span className="text-red-400">*</span>
            </label>
            <select
              value={albumId}
              onChange={(e) => setAlbumId(e.target.value)}
              className="w-full bg-[#0b2540] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#1f6aa6]"
              disabled={uploading}
            >
              <option value="">Choose an album</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              MP3 File <span className="text-red-400">*</span>
            </label>
            <input
              type="file"
              accept=".mp3,audio/mpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full bg-[#0b2540] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#1f6aa6] file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[#1f6aa6] file:text-white file:cursor-pointer"
              disabled={uploading}
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-[#1f6aa6] hover:bg-[#2a7bc4] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Upload size={20} />
            {uploading ? 'Uploading...' : 'Upload Song'}
          </button>
        </form>
      </div>
    </div>
  );
}
