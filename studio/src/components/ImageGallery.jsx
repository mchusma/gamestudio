import { useRef, useState, useEffect } from 'react';
import { useStudio } from '../context/StudioContext';
import { AddImageModal } from './AddImageModal';

// Animated preview component that loops through frames
function AnimatedPreview({ frames, frameDuration, getImageUrl }) {
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    if (frames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % frames.length);
    }, frameDuration * 1000);

    return () => clearInterval(interval);
  }, [frames.length, frameDuration]);

  if (frames.length === 0) {
    return <div className="preview-placeholder">No frames</div>;
  }

  const currentImg = frames[currentFrame];
  if (!currentImg) return null;

  return (
    <img
      src={getImageUrl(currentImg.filename)}
      alt={`Frame ${currentFrame + 1}`}
      className="sprite-preview-img"
    />
  );
}

export function ImageGallery() {
  const {
    gameData,
    uploadImage,
    uploadImageFromUrl,
    deleteImage,
    getImageUrl,
    createAnimation,
    updateAnimation,
    deleteAnimation
  } = useStudio();

  const frameInputRef = useRef(null);
  const [selectedSprite, setSelectedSprite] = useState(null);
  const [editName, setEditName] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingFrameToSprite, setAddingFrameToSprite] = useState(null);

  const images = gameData?.images || [];
  const animations = gameData?.animations || [];

  // Create unified sprite list
  // A sprite is either a standalone image or an animation
  // Standalone images are images not used in any animation
  const usedImageIds = new Set(
    animations.flatMap(anim => anim.sourceImages || [])
  );

  const sprites = [
    // Animations first (multi-frame sprites)
    ...animations.map(anim => ({
      type: 'animation',
      id: anim.id,
      name: anim.name,
      frameCount: anim.frameCount || 1,
      frameDuration: anim.frameDuration || 0.1,
      sourceImages: anim.sourceImages || [],
      frames: (anim.sourceImages || [])
        .map(imgId => images.find(img => img.id === imgId))
        .filter(Boolean),
      data: anim
    })),
    // Then standalone images (single-frame sprites)
    ...images
      .filter(img => !usedImageIds.has(img.id))
      .map(img => ({
        type: 'image',
        id: img.id,
        name: img.name,
        frameCount: 1,
        frameDuration: 0.1,
        sourceImages: [img.id],
        frames: [img],
        data: img
      }))
  ];

  const filteredSprites = sprites.filter(sprite =>
    sprite.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (sprite) => {
    setSelectedSprite(sprite);
    setEditName(sprite.name);
  };

  const handleDelete = async (e, sprite) => {
    e.stopPropagation();
    if (confirm('Delete this sprite and all its frames?')) {
      if (sprite.type === 'animation') {
        await deleteAnimation(sprite.id);
      } else {
        await deleteImage(sprite.id);
      }
      if (selectedSprite?.id === sprite.id) {
        setSelectedSprite(null);
      }
    }
  };

  const handleDeleteFrame = async (frameIndex) => {
    if (!selectedSprite) return;

    if (selectedSprite.type === 'image') {
      // Single frame - delete the whole sprite
      if (confirm('Delete this sprite?')) {
        await deleteImage(selectedSprite.id);
        setSelectedSprite(null);
      }
    } else {
      // Animation - remove frame from animation
      const newImageIds = selectedSprite.sourceImages.filter((_, i) => i !== frameIndex);

      if (newImageIds.length === 0) {
        // No frames left - delete the animation
        if (confirm('Delete this sprite? (No frames remaining)')) {
          await deleteAnimation(selectedSprite.id);
          setSelectedSprite(null);
        }
      } else if (newImageIds.length === 1) {
        // Only one frame left - could keep as animation or convert to image
        // For simplicity, keep as animation with one frame
        await updateAnimation(selectedSprite.id, { imageIds: newImageIds });
        // Update selected sprite
        const updatedFrames = newImageIds
          .map(imgId => images.find(img => img.id === imgId))
          .filter(Boolean);
        setSelectedSprite({
          ...selectedSprite,
          frameCount: newImageIds.length,
          sourceImages: newImageIds,
          frames: updatedFrames
        });
      } else {
        await updateAnimation(selectedSprite.id, { imageIds: newImageIds });
        // Update selected sprite
        const updatedFrames = newImageIds
          .map(imgId => images.find(img => img.id === imgId))
          .filter(Boolean);
        setSelectedSprite({
          ...selectedSprite,
          frameCount: newImageIds.length,
          sourceImages: newImageIds,
          frames: updatedFrames
        });
      }
    }
  };

  const handleAddFrame = () => {
    setAddingFrameToSprite(selectedSprite);
    frameInputRef.current?.click();
  };

  const handleFrameFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const sprite = addingFrameToSprite;
    if (!sprite) return;

    // Upload the new images
    const uploadedImages = [];
    for (const file of files) {
      const img = await uploadImage(file);
      if (img) uploadedImages.push(img);
    }

    if (uploadedImages.length === 0) {
      e.target.value = '';
      return;
    }

    if (sprite.type === 'image') {
      // Convert single image to animation with new frames
      const newAnim = await createAnimation({
        name: sprite.name,
        imageIds: [sprite.id, ...uploadedImages.map(i => i.id)],
        frameDuration: 0.1,
        loop: true
      });

      // Select the new animation
      if (newAnim) {
        const allFrames = [sprite.frames[0], ...uploadedImages];
        setSelectedSprite({
          type: 'animation',
          id: newAnim.id,
          name: newAnim.name,
          frameCount: newAnim.frameCount,
          frameDuration: newAnim.frameDuration,
          sourceImages: newAnim.sourceImages,
          frames: allFrames,
          data: newAnim
        });
      }
    } else {
      // Add frames to existing animation
      const newImageIds = [...sprite.sourceImages, ...uploadedImages.map(i => i.id)];
      await updateAnimation(sprite.id, { imageIds: newImageIds });

      // Update selected sprite
      const updatedFrames = [...sprite.frames, ...uploadedImages];
      setSelectedSprite({
        ...sprite,
        frameCount: newImageIds.length,
        sourceImages: newImageIds,
        frames: updatedFrames
      });
    }

    e.target.value = '';
    setAddingFrameToSprite(null);
  };

  const handleUpdateFrameDuration = async (newDuration) => {
    if (!selectedSprite || selectedSprite.type !== 'animation') return;

    await updateAnimation(selectedSprite.id, { frameDuration: newDuration });
    setSelectedSprite({ ...selectedSprite, frameDuration: newDuration });
  };

  return (
    <div className="image-gallery-container">
      {/* Left column - List */}
      <div className="image-list-column">
        <div className="column-header">
          <h3>Sprites</h3>
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
          {filteredSprites.map((sprite) => (
            <div
              key={`${sprite.type}-${sprite.id}`}
              className={`image-list-item ${selectedSprite?.id === sprite.id && selectedSprite?.type === sprite.type ? 'selected' : ''}`}
              onClick={() => handleSelect(sprite)}
            >
              <div className="image-list-thumb">
                {sprite.frames[0] && (
                  <img src={getImageUrl(sprite.frames[0].filename)} alt={sprite.name} />
                )}
                {sprite.frameCount > 1 && (
                  <span className="animation-badge">{sprite.frameCount}f</span>
                )}
              </div>
              <div className="image-list-info">
                <span className="image-list-name">{sprite.name}</span>
                <span className="image-list-meta">
                  {sprite.frameCount > 1 ? `${sprite.frameCount} frames` : `${sprite.frames[0]?.width || 0}×${sprite.frames[0]?.height || 0}`}
                </span>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => handleDelete(e, sprite)}
              >
                ×
              </button>
            </div>
          ))}

          {sprites.length === 0 && (
            <div className="empty-list">
              <p>No sprites yet</p>
              <p className="hint">Click + Add to create</p>
            </div>
          )}
        </div>
      </div>

      {/* Right column - Detail panel */}
      {selectedSprite && (
        <div className="image-detail-column">
          <div className="column-header">
            <h3>Sprite Details</h3>
          </div>

          <div className="sprite-editor">
            {/* Left: Preview */}
            <div className="sprite-preview">
              <AnimatedPreview
                frames={selectedSprite.frames}
                frameDuration={selectedSprite.frameDuration}
                getImageUrl={getImageUrl}
              />
            </div>

            {/* Right: Frame strip */}
            <div className="frame-strip-container">
              <div className="frame-strip">
                {selectedSprite.frames.map((frame, i) => (
                  <div key={frame.id} className="frame-item">
                    <div className="frame-image">
                      <img src={getImageUrl(frame.filename)} alt={`Frame ${i + 1}`} />
                      <button
                        className="frame-delete-btn"
                        onClick={() => handleDeleteFrame(i)}
                        title="Remove frame"
                      >
                        ×
                      </button>
                    </div>
                    <span className="frame-number">{i + 1}</span>
                  </div>
                ))}

                {/* Add frame button */}
                <div className="frame-item add-frame" onClick={handleAddFrame}>
                  <div className="frame-image add-frame-btn">
                    <span>+</span>
                  </div>
                  <span className="frame-number">Add</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sprite-controls">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Sprite name"
              />
            </div>

            {selectedSprite.frameCount > 1 && (
              <div className="form-group">
                <label>Frame Duration (seconds)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={selectedSprite.frameDuration}
                  onChange={(e) => handleUpdateFrameDuration(parseFloat(e.target.value))}
                />
              </div>
            )}

            <button
              className="danger"
              onClick={(e) => handleDelete(e, selectedSprite)}
            >
              Delete Sprite
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input for adding frames */}
      <input
        ref={frameInputRef}
        type="file"
        accept="image/png"
        multiple
        onChange={handleFrameFileSelect}
        style={{ display: 'none' }}
      />

      {showAddModal && (
        <AddImageModal
          onClose={() => setShowAddModal(false)}
          onUpload={uploadImage}
          onUploadFromUrl={uploadImageFromUrl}
        />
      )}
    </div>
  );
}
