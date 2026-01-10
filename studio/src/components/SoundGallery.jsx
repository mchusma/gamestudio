import { useRef, useState } from 'react';
import { useStudio } from '../context/StudioContext';

export function SoundGallery() {
  const { gameData, uploadSound, deleteSound, getSoundUrl } = useStudio();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [selectedSound, setSelectedSound] = useState(null);
  const [search, setSearch] = useState('');
  const audioRef = useRef(null);

  const sounds = gameData?.sounds || [];

  const filteredSounds = sounds.filter(sound =>
    sound.name.toLowerCase().includes(search.toLowerCase())
  );

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

  const handleDelete = async (e, sound) => {
    e.stopPropagation();
    if (confirm('Delete this sound?')) {
      await deleteSound(sound.id);
      if (selectedSound?.id === sound.id) {
        setSelectedSound(null);
      }
    }
  };

  const handleSelect = (sound) => {
    setSelectedSound(sound);
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

  return (
    <div className="image-gallery-container">
      {/* Left column - List */}
      <div className="image-list-column">
        <div className="column-header">
          <h3>Sounds</h3>
          <button
            className="small"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            + Add
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

        <div className="list-search">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="image-list">
          {filteredSounds.map((sound) => (
            <div
              key={sound.id}
              className={`image-list-item ${selectedSound?.id === sound.id ? 'selected' : ''}`}
              onClick={() => handleSelect(sound)}
            >
              <div className="image-list-thumb">
                <span style={{ fontSize: '20px' }}>🔊</span>
              </div>
              <div className="image-list-info">
                <span className="image-list-name">{sound.name}</span>
                <span className="image-list-meta">.{sound.format}</span>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => handleDelete(e, sound)}
              >
                ×
              </button>
            </div>
          ))}

          {sounds.length === 0 && (
            <div className="empty-list">
              <p>No sounds yet</p>
              <p className="hint">Click + Add to upload</p>
            </div>
          )}
        </div>
      </div>

      {/* Right column - Detail panel */}
      {selectedSound && (
        <div className="image-detail-column">
          <div className="column-header">
            <h3>Sound Details</h3>
          </div>

          <div className="detail-preview">
            <span style={{ fontSize: '64px' }}>🔊</span>
          </div>

          <div className="detail-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={selectedSound.name}
                readOnly
                placeholder="Sound name"
              />
            </div>

            <div className="form-group">
              <label>Format</label>
              <input
                type="text"
                value={`.${selectedSound.format}`}
                readOnly
              />
            </div>

            <button
              onClick={() => handlePlay(selectedSound)}
              style={{ marginTop: '8px' }}
            >
              {playingId === selectedSound.id ? '⏹ Stop' : '▶ Play'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
