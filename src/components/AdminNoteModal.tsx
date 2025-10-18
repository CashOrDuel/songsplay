import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AdminNoteModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AdminNoteModal({ isOpen, onClose }: AdminNoteModalProps) {
  const [note, setNote] = useState('');
  const [songRequest, setSongRequest] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!note.trim()) {
      setError('Please write a note');
      return;
    }

    setSending(true);

    try {
      const { error: insertError } = await supabase
        .from('admin_notes')
        .insert({
          note: note.trim(),
          song_request: songRequest.trim() || null,
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setNote('');
      setSongRequest('');

      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Note submission error:', err);
      setError('Failed to send note. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#071124] to-[#0b1630] rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Note for Admin</h2>
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

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-lg mb-4">
            Note sent successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Your Note <span className="text-red-400">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#0b2540] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#1f6aa6] min-h-[100px] resize-none"
              placeholder="Write your message to the admin..."
              disabled={sending}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Song Request (Optional)</label>
            <input
              type="text"
              value={songRequest}
              onChange={(e) => setSongRequest(e.target.value)}
              className="w-full bg-[#0b2540] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#1f6aa6]"
              placeholder="Request a song to be added..."
              disabled={sending}
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-[#1f6aa6] hover:bg-[#2a7bc4] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send size={20} />
            {sending ? 'Sending...' : 'Send Note'}
          </button>
        </form>
      </div>
    </div>
  );
}
