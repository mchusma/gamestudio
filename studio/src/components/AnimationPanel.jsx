import { useState, useRef, useEffect } from 'react';
import { useStudio } from '../context/StudioContext';

function AnimationPreview({ images, frameDuration, loop, getImageUrl }) {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const loadedImagesRef = useRef([]);

  // Load images
  useEffect(() => {
    if (images.length === 0) return;

    const loadImages = async () => {
      const loaded = await Promise.all(
        images.map((img) => {
          return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => resolve(null);
            image.src = getImageUrl(img.filename);
          });
        })
      );
      loadedImagesRef.current = loaded.filter(Boolean);
    };

    loadImages();
  }, [images, getImageUrl]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || images.length === 0) return;

    let animationId;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const animate = (time) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;

      const elapsed = time - lastTimeRef.current;
      if (elapsed >= frameDuration * 1000) {
        lastTimeRef.current = time;

        frameRef.current++;
        if (frameRef.current >= loadedImagesRef.current.length) {
          if (loop) {
            frameRef.current = 0;
          } else {
            frameRef.current = loadedImagesRef.current.length - 1;
            setIsPlaying(false);
            return;
          }
        }
        setCurrentFrame(frameRef.current);
      }

      // Draw current frame
      const img = loadedImagesRef.current[frameRef.current];
      if (img) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Center and scale to fit
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height, 4);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x, y, w, h);
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, images.length, frameDuration, loop]);

  // Draw initial frame when paused
  useEffect(() => {
    if (isPlaying || loadedImagesRef.current.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const img = loadedImagesRef.current[frameRef.current];
    if (img) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height, 4);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, x, y, w, h);
    }
  }, [isPlaying, currentFrame]);

  const reset = () => {
    frameRef.current = 0;
    lastTimeRef.current = 0;
    setCurrentFrame(0);
    setIsPlaying(true);
  };

  if (images.length === 0) {
    return (
      <div className="animation-preview">
        <p style={{ color: 'var(--text-secondary)' }}>Select frames to preview</p>
      </div>
    );
  }

  return (
    <div className="animation-preview">
      <canvas ref={canvasRef} width={128} height={128} />
      <div className="animation-preview-controls">
        <button className="small secondary" onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button className="small secondary" onClick={reset}>
          ⏮ Reset
        </button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        Frame {currentFrame + 1} of {images.length}
      </div>
    </div>
  );
}

function AnimationEditor({ animation, onSave, onCancel }) {
  const { gameData, getImageUrl } = useStudio();
  const [name, setName] = useState(animation?.name || '');
  const [selectedImages, setSelectedImages] = useState(
    animation?.sourceImages?.map(id => gameData.images.find(i => i.id === id)).filter(Boolean) || []
  );
  const [frameDuration, setFrameDuration] = useState(animation?.frameDuration || 0.1);
  const [loop, setLoop] = useState(animation?.loop !== false);

  const availableImages = gameData?.images || [];

  const toggleImage = (image) => {
    const exists = selectedImages.find(i => i.id === image.id);
    if (exists) {
      setSelectedImages(selectedImages.filter(i => i.id !== image.id));
    } else {
      setSelectedImages([...selectedImages, image]);
    }
  };

  const moveFrame = (index, direction) => {
    const newImages = [...selectedImages];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newImages.length) return;
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    setSelectedImages(newImages);
  };

  const removeFrame = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim() || selectedImages.length === 0) return;
    onSave({
      name: name.trim(),
      imageIds: selectedImages.map(i => i.id),
      frameDuration,
      loop
    });
  };

  return (
    <div className="animation-editor">
      <h3>{animation ? 'Edit Animation' : 'New Animation'}</h3>
      <div className="animation-form">
        <div className="form-group">
          <label>Animation Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., player_walk"
          />
        </div>

        <div className="form-group">
          <label>Selected Frames (in order)</label>
          <div className="frame-picker">
            {selectedImages.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Click images below to add frames
              </p>
            ) : (
              selectedImages.map((img, i) => (
                <div key={`${img.id}-${i}`} className="frame-picker-item selected">
                  <img src={getImageUrl(img.filename)} alt={img.name} />
                  <span className="frame-number">{i + 1}</span>
                  <div style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    display: 'flex',
                    gap: 2
                  }}>
                    {i > 0 && (
                      <button
                        className="small"
                        style={{ padding: '0 4px', fontSize: 10 }}
                        onClick={() => moveFrame(i, -1)}
                      >
                        ←
                      </button>
                    )}
                    {i < selectedImages.length - 1 && (
                      <button
                        className="small"
                        style={{ padding: '0 4px', fontSize: 10 }}
                        onClick={() => moveFrame(i, 1)}
                      >
                        →
                      </button>
                    )}
                    <button
                      className="small danger"
                      style={{ padding: '0 4px', fontSize: 10 }}
                      onClick={() => removeFrame(i)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Available Images (click to add)</label>
          <div className="frame-picker">
            {availableImages.map((img) => (
              <div
                key={img.id}
                className={`frame-picker-item ${selectedImages.find(i => i.id === img.id) ? 'selected' : ''}`}
                onClick={() => toggleImage(img)}
              >
                <img src={getImageUrl(img.filename)} alt={img.name} />
              </div>
            ))}
            {availableImages.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                No images available. Upload some images first.
              </p>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Frame Duration (seconds)</label>
            <input
              type="number"
              min="0.01"
              max="2"
              step="0.01"
              value={frameDuration}
              onChange={(e) => setFrameDuration(parseFloat(e.target.value) || 0.1)}
            />
          </div>
          <div className="form-group">
            <label>&nbsp;</label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
              />
              Loop animation
            </label>
          </div>
        </div>

        <AnimationPreview
          images={selectedImages}
          frameDuration={frameDuration}
          loop={loop}
          getImageUrl={getImageUrl}
        />

        <div className="modal-actions" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
          <button className="secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || selectedImages.length === 0}
          >
            {animation ? 'Save Changes' : 'Create Animation'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AnimationPanel() {
  const { gameData, createAnimation, updateAnimation, deleteAnimation, getImageUrl } = useStudio();
  const [editing, setEditing] = useState(null); // null, 'new', or animation id
  const [previewingId, setPreviewingId] = useState(null);

  const animations = gameData?.animations || [];

  const handleCreate = async (data) => {
    await createAnimation(data);
    setEditing(null);
  };

  const handleUpdate = async (data) => {
    await updateAnimation(editing, data);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this animation?')) {
      await deleteAnimation(id);
    }
  };

  if (editing === 'new') {
    return (
      <div className="content-panel">
        <AnimationEditor
          onSave={handleCreate}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  if (editing) {
    const animation = animations.find(a => a.id === editing);
    return (
      <div className="content-panel">
        <AnimationEditor
          animation={animation}
          onSave={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="content-panel">
      <div className="panel-header">
        <h2>Animations</h2>
        <div className="panel-actions">
          <button onClick={() => setEditing('new')}>
            + New Animation
          </button>
        </div>
      </div>

      {animations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎬</div>
          <p>No animations yet</p>
          <p>Create an animation from your images</p>
        </div>
      ) : (
        <div className="animation-list">
          {animations.map((anim) => {
            const sourceImages = anim.sourceImages
              ?.map(id => gameData.images.find(i => i.id === id))
              .filter(Boolean) || [];

            return (
              <div key={anim.id} className="animation-card">
                <div className="animation-card-header">
                  <div>
                    <div className="animation-card-name">{anim.name}</div>
                    <div className="animation-card-meta">
                      {anim.frameCount} frames · {anim.frameDuration}s · {anim.loop ? 'looping' : 'once'}
                    </div>
                  </div>
                  <div className="panel-actions">
                    <button
                      className="small secondary"
                      onClick={() => setPreviewingId(previewingId === anim.id ? null : anim.id)}
                    >
                      {previewingId === anim.id ? 'Hide Preview' : 'Preview'}
                    </button>
                    <button className="small secondary" onClick={() => setEditing(anim.id)}>
                      Edit
                    </button>
                    <button className="small danger" onClick={() => handleDelete(anim.id)}>
                      Delete
                    </button>
                  </div>
                </div>

                <div className="animation-frames-preview">
                  {sourceImages.slice(0, 8).map((img, i) => (
                    <img
                      key={`${img.id}-${i}`}
                      src={getImageUrl(img.filename)}
                      alt={`Frame ${i + 1}`}
                    />
                  ))}
                  {sourceImages.length > 8 && (
                    <span style={{ alignSelf: 'center', color: 'var(--text-secondary)' }}>
                      +{sourceImages.length - 8} more
                    </span>
                  )}
                </div>

                {previewingId === anim.id && (
                  <AnimationPreview
                    images={sourceImages}
                    frameDuration={anim.frameDuration}
                    loop={anim.loop}
                    getImageUrl={getImageUrl}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
