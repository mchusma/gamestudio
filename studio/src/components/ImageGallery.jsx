import { useRef, useState } from 'react';
import { useStudio } from '../context/StudioContext';

export function ImageGallery() {
  const { gameData, uploadImage, deleteImage, getImageUrl, createAnimation, updateAnimation, deleteAnimation, getAnimationUrl } = useStudio();
  const fileInputRef = useRef(null);
  const animationInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null); // 'image' or 'animation'
  const [editName, setEditName] = useState('');
  const [showConvertToAnimation, setShowConvertToAnimation] = useState(false);
  const [animationName, setAnimationName] = useState('');
  const [frameDuration, setFrameDuration] = useState(0.1);
  const [search, setSearch] = useState('');

  const images = gameData?.images || [];
  const animations = gameData?.animations || [];

  const filteredImages = images.filter(img =>
    img.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAnimations = animations.filter(anim =>
    anim.name.toLowerCase().includes(search.toLowerCase())
  );

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

  const handleAnimationFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedImages = [];
    for (const file of files) {
      const img = await uploadImage(file);
      if (img) uploadedImages.push(img);
    }

    if (uploadedImages.length > 0 && selectedItem && selectedType === 'animation') {
      // Add to existing animation
      const currentImageIds = selectedItem.sourceImages || [];
      const newImageIds = [...currentImageIds, ...uploadedImages.map(i => i.id)];
      await updateAnimation(selectedItem.id, { imageIds: newImageIds });
    }

    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (e, item, type) => {
    e.stopPropagation();
    if (confirm(`Delete this ${type}?`)) {
      if (type === 'image') {
        await deleteImage(item.id);
      } else {
        await deleteAnimation(item.id);
      }
      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
        setSelectedType(null);
      }
    }
  };

  const handleSelect = (item, type) => {
    setSelectedItem(item);
    setSelectedType(type);
    setEditName(item.name);
    setShowConvertToAnimation(false);
  };

  const handleConvertToAnimation = async () => {
    if (!animationName.trim()) return;

    await createAnimation({
      name: animationName,
      imageIds: [selectedItem.id],
      frameDuration,
      loop: true
    });

    setShowConvertToAnimation(false);
    setAnimationName('');
  };

  const handleUpdateFrameDuration = async (newDuration) => {
    if (selectedType === 'animation') {
      await updateAnimation(selectedItem.id, { frameDuration: newDuration });
      setSelectedItem({ ...selectedItem, frameDuration: newDuration });
    }
  };

  return (
    <div className="image-gallery-container">
      {/* Left column - List */}
      <div className="image-list-column">
        <div className="column-header">
          <h3>Images</h3>
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
            accept="image/png"
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
          {/* Animations */}
          {filteredAnimations.map((anim) => (
            <div
              key={`anim-${anim.id}`}
              className={`image-list-item ${selectedItem?.id === anim.id && selectedType === 'animation' ? 'selected' : ''}`}
              onClick={() => handleSelect(anim, 'animation')}
            >
              <div className="image-list-thumb">
                <img src={getAnimationUrl(anim.filename)} alt={anim.name} />
                <span className="animation-badge">{anim.frameCount}f</span>
              </div>
              <div className="image-list-info">
                <span className="image-list-name">{anim.name}</span>
                <span className="image-list-meta">Animation</span>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => handleDelete(e, anim, 'animation')}
              >
                ×
              </button>
            </div>
          ))}

          {/* Images */}
          {filteredImages.map((image) => (
            <div
              key={`img-${image.id}`}
              className={`image-list-item ${selectedItem?.id === image.id && selectedType === 'image' ? 'selected' : ''}`}
              onClick={() => handleSelect(image, 'image')}
            >
              <div className="image-list-thumb">
                <img src={getImageUrl(image.filename)} alt={image.name} />
              </div>
              <div className="image-list-info">
                <span className="image-list-name">{image.name}</span>
                <span className="image-list-meta">{image.width}×{image.height}</span>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => handleDelete(e, image, 'image')}
              >
                ×
              </button>
            </div>
          ))}

          {images.length === 0 && animations.length === 0 && (
            <div className="empty-list">
              <p>No images yet</p>
              <p className="hint">Click + Add to upload</p>
            </div>
          )}
        </div>
      </div>

      {/* Right column - Detail panel */}
      {selectedItem && (
        <div className="image-detail-column">
          <div className="column-header">
            <h3>{selectedType === 'animation' ? 'Animation' : 'Image'} Details</h3>
          </div>

          <div className="detail-preview">
            {selectedType === 'animation' ? (
              <img src={getAnimationUrl(selectedItem.filename)} alt={selectedItem.name} />
            ) : (
              <img src={getImageUrl(selectedItem.filename)} alt={selectedItem.name} />
            )}
          </div>

          <div className="detail-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Image name"
              />
            </div>

            {selectedType === 'animation' && (
              <>
                <div className="form-group">
                  <label>Frame Duration (seconds)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={selectedItem.frameDuration}
                    onChange={(e) => handleUpdateFrameDuration(parseFloat(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label>Frames ({selectedItem.frameCount})</label>
                  <div className="animation-frames">
                    {(selectedItem.sourceImages || []).map((imgId, i) => {
                      const img = images.find(im => im.id === imgId);
                      return img ? (
                        <div key={imgId} className="frame-thumb">
                          <img src={getImageUrl(img.filename)} alt={`Frame ${i + 1}`} />
                          <span>{i + 1}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                  <button
                    className="secondary small"
                    onClick={() => animationInputRef.current?.click()}
                  >
                    + Add Frames
                  </button>
                  <input
                    ref={animationInputRef}
                    type="file"
                    accept="image/png"
                    multiple
                    onChange={handleAnimationFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>
              </>
            )}

            {selectedType === 'image' && !showConvertToAnimation && (
              <button
                className="secondary"
                onClick={() => {
                  setShowConvertToAnimation(true);
                  setAnimationName(selectedItem.name + ' Animation');
                }}
              >
                Make Animation
              </button>
            )}

            {showConvertToAnimation && (
              <div className="convert-animation-form">
                <div className="form-group">
                  <label>Animation Name</label>
                  <input
                    type="text"
                    value={animationName}
                    onChange={(e) => setAnimationName(e.target.value)}
                    placeholder="Animation name"
                  />
                </div>
                <div className="form-group">
                  <label>Frame Duration (seconds)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={frameDuration}
                    onChange={(e) => setFrameDuration(parseFloat(e.target.value))}
                  />
                </div>
                <div className="button-row">
                  <button onClick={handleConvertToAnimation}>Create</button>
                  <button className="secondary" onClick={() => setShowConvertToAnimation(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
