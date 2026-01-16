import { useState, useRef } from 'react';

export function AddSoundModal({ onClose, onUpload, onUploadFromUrl }) {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // AI Generation state
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedSounds, setGeneratedSounds] = useState([]);
  const [error, setError] = useState(null);
  const [selectedSounds, setSelectedSounds] = useState(new Set());
  const [savingSounds, setSavingSounds] = useState(new Set());
  const [playingUrl, setPlayingUrl] = useState(null);
  const audioRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    for (const file of files) {
      await onUpload(file);
    }
    setUploading(false);
    e.target.value = '';
    onClose();
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/generate-sound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: prompt,
          duration: duration ? parseFloat(duration) : null
        })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else if (data.audioUrl) {
        setGeneratedSounds(prev => [...prev, {
          url: data.audioUrl,
          prompt: prompt,
          id: Date.now()
        }]);
        setPrompt('');
      }
    } catch (err) {
      setError('Failed to connect to the server. Make sure it is running.');
    }

    setGenerating(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handlePlay = (sound) => {
    if (playingUrl === sound.url) {
      audioRef.current?.pause();
      setPlayingUrl(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(sound.url);
    audio.onended = () => setPlayingUrl(null);
    audio.play();
    audioRef.current = audio;
    setPlayingUrl(sound.url);
  };

  const toggleSoundSelection = (soundId) => {
    setSelectedSounds(prev => {
      const next = new Set(prev);
      if (next.has(soundId)) {
        next.delete(soundId);
      } else {
        next.add(soundId);
      }
      return next;
    });
  };

  const handleUploadSelected = async () => {
    if (selectedSounds.size === 0) return;

    setUploading(true);
    for (const soundId of selectedSounds) {
      const sound = generatedSounds.find(s => s.id === soundId);
      if (sound) {
        await onUploadFromUrl(sound.url, sound.prompt.slice(0, 50));
      }
    }
    setUploading(false);
    setSelectedSounds(new Set());
    onClose();
  };

  const handleSaveSound = async (sound) => {
    setSavingSounds(prev => new Set(prev).add(sound.id));
    try {
      await onUploadFromUrl(sound.url, sound.prompt.slice(0, 50));
    } finally {
      setSavingSounds(prev => {
        const next = new Set(prev);
        next.delete(sound.id);
        return next;
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal add-image-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Sound</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload
          </button>
          <button
            className={`modal-tab ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            Generate with AI
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'upload' && (
            <div className="upload-tab">
              <div
                className="upload-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-icon">🔊</div>
                <p>Click to select audio files</p>
                <p className="hint">MP3, WAV, OGG supported</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              {uploading && <p className="uploading-text">Uploading...</p>}
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="generate-tab">
              <div className="sound-generator">
                {generatedSounds.length === 0 && !error && (
                  <div className="chat-placeholder">
                    <p>Generate sound effects with ElevenLabs</p>
                    <p className="hint">Describe the sound you want to create</p>
                  </div>
                )}

                {error && (
                  <div className="sound-error">
                    <span className="error-text">{error}</span>
                  </div>
                )}

                {generatedSounds.length > 0 && (
                  <div className="generated-sounds-list">
                    {generatedSounds.map((sound) => (
                      <div
                        key={sound.id}
                        className={`generated-sound-item ${selectedSounds.has(sound.id) ? 'selected' : ''}`}
                        onClick={() => toggleSoundSelection(sound.id)}
                      >
                        <div className="sound-item-play">
                          <button
                            className="play-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlay(sound);
                            }}
                          >
                            {playingUrl === sound.url ? '⏹' : '▶'}
                          </button>
                        </div>
                        <div className="sound-item-info">
                          <span className="sound-item-prompt">{sound.prompt}</span>
                        </div>
                        <div className="sound-item-actions">
                          <button
                            className="sound-action-btn save-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveSound(sound);
                            }}
                            disabled={savingSounds.has(sound.id)}
                            title="Save to project"
                          >
                            {savingSounds.has(sound.id) ? '...' : '💾'}
                          </button>
                        </div>
                        <div className="sound-select-indicator">
                          {selectedSounds.has(sound.id) ? '✓' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {generating && (
                  <div className="generating-sound">
                    <span className="generating-indicator">Generating sound effect...</span>
                  </div>
                )}
              </div>

              <div className="sound-input-area">
                <div className="sound-input-row">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe the sound effect (e.g., 'laser gun firing', 'footsteps on gravel')"
                    rows={2}
                    disabled={generating}
                  />
                  <div className="duration-input">
                    <label>Duration (s)</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Auto"
                      min="0.5"
                      max="30"
                      step="0.5"
                      disabled={generating}
                    />
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || generating}
                >
                  {generating ? 'Generating...' : 'Generate'}
                </button>
              </div>

              {selectedSounds.size > 0 && (
                <div className="selected-images-bar">
                  <span>{selectedSounds.size} sound{selectedSounds.size > 1 ? 's' : ''} selected</span>
                  <button onClick={handleUploadSelected} disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Add to Project'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
