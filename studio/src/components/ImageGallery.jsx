import { useRef, useState } from 'react';
import { useStudio } from '../context/StudioContext';

export function ImageGallery() {
  const { gameData, uploadImage, deleteImage, getImageUrl } = useStudio();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    for (const file of files) {
      await uploadImage(file);
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirm('Delete this image?')) {
      await deleteImage(id);
    }
  };

  const handleAIGenerate = async () => {
    // TODO: Integrate with actual AI image generation API
    alert('AI image generation coming soon!\n\nPrompt: ' + aiPrompt);
    setAiPrompt('');
    setShowAI(false);
  };

  const images = gameData?.images || [];

  return (
    <div className="content-panel">
      <div className="panel-header">
        <h2>Images</h2>
        <div className="panel-actions">
          <button className="secondary" onClick={() => setShowAI(!showAI)}>
            Generate with AI
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {showAI && (
        <div className="animation-editor" style={{ marginBottom: 20 }}>
          <h3>Generate Image with AI</h3>
          <div className="animation-form">
            <div className="form-group">
              <label>Describe your image</label>
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., a cute blue cat, pixel art style, 32x32"
              />
            </div>
            <div className="panel-actions">
              <button onClick={handleAIGenerate} disabled={!aiPrompt.trim()}>
                Generate
              </button>
              <button className="secondary" onClick={() => setShowAI(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {images.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🖼️</div>
          <p>No images yet</p>
          <p>Upload images or generate them with AI</p>
        </div>
      ) : (
        <div className="asset-grid">
          {images.map((image) => (
            <div key={image.id} className="asset-card">
              <div className="asset-card-image">
                <img
                  src={getImageUrl(image.filename)}
                  alt={image.name}
                />
              </div>
              <div className="asset-card-info">
                <span className="asset-card-name" title={image.name}>
                  {image.name}
                </span>
                <div className="asset-card-actions">
                  <button
                    className="delete small"
                    onClick={(e) => handleDelete(e, image.id)}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
