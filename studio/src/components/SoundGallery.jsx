import { useRef, useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { AddSoundModal } from './AddSoundModal';

export function SoundGallery() {
  const { gameData, uploadSound, uploadSoundFromUrl, updateSound, deleteSound, getSoundUrl } = useStudio();
  const [playingId, setPlayingId] = useState(null);
  const [selectedSound, setSelectedSound] = useState(null);
  const [editName, setEditName] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const audioRef = useRef(null);

  const sounds = gameData?.sounds || [];

  const filteredSounds = sounds.filter(sound =>
    sound.name.toLowerCase().includes(search.toLowerCase())
  );

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
    setEditName(sound.name);
  };

  const handleUpdateName = async () => {
    if (!selectedSound || !editName.trim() || editName === selectedSound.name) return;
    await updateSound(selectedSound.id, { name: editName.trim() });
    setSelectedSound({ ...selectedSound, name: editName.trim() });
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
            onClick={() => setShowAddModal(true)}
          >
            + Add
          </button>
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
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleUpdateName}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
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

      {showAddModal && (
        <AddSoundModal
          onClose={() => setShowAddModal(false)}
          onUpload={uploadSound}
          onUploadFromUrl={uploadSoundFromUrl}
        />
      )}
    </div>
  );
}
