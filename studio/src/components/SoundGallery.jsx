import { useRef, useState } from 'react';
import { useStudio } from '../context/StudioContext';

export function SoundGallery() {
  const { gameData, uploadSound, deleteSound, getSoundUrl } = useStudio();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    for (const file of files) {
      await uploadSound(file);
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this sound?')) {
      await deleteSound(id);
    }
  };

  const handlePlay = (sound) => {
    if (playingId === sound.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(getSoundUrl(sound.filename));
    audio.onended = () => setPlayingId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingId(sound.id);
  };

  const sounds = gameData?.sounds || [];

  return (
    <div className="content-panel">
      <div className="panel-header">
        <h2>Sounds</h2>
        <div className="panel-actions">
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Sound'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {sounds.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔊</div>
          <p>No sounds yet</p>
          <p>Upload .wav, .mp3, or .ogg files</p>
        </div>
      ) : (
        <div className="sound-list">
          {sounds.map((sound) => (
            <div key={sound.id} className="sound-item">
              <span className="sound-item-icon">🔊</span>
              <div className="sound-item-info">
                <div className="sound-item-name">{sound.name}</div>
                <div className="sound-item-format">.{sound.format}</div>
              </div>
              <div className="sound-item-actions">
                <button
                  className="secondary small"
                  onClick={() => handlePlay(sound)}
                >
                  {playingId === sound.id ? '⏹ Stop' : '▶ Play'}
                </button>
                <button
                  className="danger small"
                  onClick={() => handleDelete(sound.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
