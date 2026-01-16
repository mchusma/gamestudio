import { useState, useRef, useEffect, useCallback } from 'react';
import { useStudio } from '../context/StudioContext';

// Tile palette showing all tiles from a tileset
function TilePalette({ tileset, selectedTile, onSelectTile, getImageUrl }) {
  const { gameData } = useStudio();
  const canvasRef = useRef(null);
  const [hoveredTile, setHoveredTile] = useState(null);

  const sourceImage = gameData?.images?.find(i => i.id === tileset?.imageId);

  useEffect(() => {
    if (!canvasRef.current || !sourceImage || !tileset) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = getImageUrl(sourceImage.filename);

    img.onload = () => {
      canvas.width = tileset.columns * tileset.tileWidth;
      canvas.height = tileset.rows * tileset.tileHeight;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0);

      // Draw grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= tileset.columns; x++) {
        ctx.beginPath();
        ctx.moveTo(x * tileset.tileWidth, 0);
        ctx.lineTo(x * tileset.tileWidth, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= tileset.rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * tileset.tileHeight);
        ctx.lineTo(canvas.width, y * tileset.tileHeight);
        ctx.stroke();
      }

      // Highlight selected tile
      if (selectedTile !== null && selectedTile > 0) {
        const tileX = (selectedTile - 1) % tileset.columns;
        const tileY = Math.floor((selectedTile - 1) / tileset.columns);
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          tileX * tileset.tileWidth + 1,
          tileY * tileset.tileHeight + 1,
          tileset.tileWidth - 2,
          tileset.tileHeight - 2
        );
      }
    };
  }, [tileset, sourceImage, selectedTile, getImageUrl]);

  const handleClick = (e) => {
    if (!tileset) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const tileX = Math.floor(x / tileset.tileWidth);
    const tileY = Math.floor(y / tileset.tileHeight);
    const tileIndex = tileY * tileset.columns + tileX + 1; // 1-indexed, 0 = empty
    onSelectTile(tileIndex);
  };

  if (!tileset || !sourceImage) {
    return <div className="tile-palette-empty">Select a tileset</div>;
  }

  return (
    <div className="tile-palette">
      <div className="tile-palette-header">
        <span>Tile: {selectedTile || 'None (eraser)'}</span>
        <button className="small secondary" onClick={() => onSelectTile(0)}>
          Eraser
        </button>
      </div>
      <div className="tile-palette-canvas-container">
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          style={{ cursor: 'pointer', maxWidth: '100%' }}
        />
      </div>
    </div>
  );
}

// Main tile editor canvas
function TileEditor({ background, tileset, selectedTile, selectedLayerId, onUpdateBackground, getImageUrl }) {
  const { gameData } = useStudio();
  const canvasRef = useRef(null);
  const [isPainting, setIsPainting] = useState(false);
  const tilesetImageRef = useRef(null);

  const sourceImage = gameData?.images?.find(i => i.id === tileset?.imageId);
  const currentLayer = background?.layers?.find(l => l.id === selectedLayerId);

  // Load tileset image
  useEffect(() => {
    if (!sourceImage) return;
    const img = new Image();
    img.src = getImageUrl(sourceImage.filename);
    img.onload = () => {
      tilesetImageRef.current = img;
      drawCanvas();
    };
  }, [sourceImage, getImageUrl]);

  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !background || !tileset) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pixelWidth = background.width * tileset.tileWidth;
    const pixelHeight = background.height * tileset.tileHeight;

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    ctx.imageSmoothingEnabled = false;

    // Clear with checkered background
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, pixelWidth, pixelHeight);
    for (let y = 0; y < pixelHeight; y += 16) {
      for (let x = 0; x < pixelWidth; x += 16) {
        if ((x / 16 + y / 16) % 2 === 0) {
          ctx.fillStyle = '#2a2a2a';
          ctx.fillRect(x, y, 16, 16);
        }
      }
    }

    // Draw all visible layers
    if (tilesetImageRef.current && background.layers) {
      for (const layer of background.layers) {
        if (!layer.visible) continue;
        for (let y = 0; y < background.height; y++) {
          for (let x = 0; x < background.width; x++) {
            const tileIndex = layer.data[y * background.width + x];
            if (tileIndex > 0) {
              const srcX = ((tileIndex - 1) % tileset.columns) * tileset.tileWidth;
              const srcY = Math.floor((tileIndex - 1) / tileset.columns) * tileset.tileHeight;
              ctx.drawImage(
                tilesetImageRef.current,
                srcX, srcY, tileset.tileWidth, tileset.tileHeight,
                x * tileset.tileWidth, y * tileset.tileHeight,
                tileset.tileWidth, tileset.tileHeight
              );
            }
          }
        }
      }
    }

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= background.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * tileset.tileWidth, 0);
      ctx.lineTo(x * tileset.tileWidth, pixelHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= background.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * tileset.tileHeight);
      ctx.lineTo(pixelWidth, y * tileset.tileHeight);
      ctx.stroke();
    }
  }, [background, tileset]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas, background?.layers]);

  const paintTile = (e) => {
    if (!background || !tileset || !currentLayer) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / tileset.tileWidth);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / tileset.tileHeight);

    if (x < 0 || x >= background.width || y < 0 || y >= background.height) return;

    const index = y * background.width + x;
    if (currentLayer.data[index] === selectedTile) return;

    const newData = [...currentLayer.data];
    newData[index] = selectedTile;

    const updatedLayers = background.layers.map(l =>
      l.id === selectedLayerId ? { ...l, data: newData } : l
    );

    onUpdateBackground({ ...background, layers: updatedLayers });
  };

  const handleMouseDown = (e) => {
    setIsPainting(true);
    paintTile(e);
  };

  const handleMouseMove = (e) => {
    if (isPainting) paintTile(e);
  };

  const handleMouseUp = () => {
    setIsPainting(false);
  };

  if (!background || !tileset) {
    return (
      <div className="tile-editor-empty">
        Select a background to edit
      </div>
    );
  }

  return (
    <div className="tile-editor">
      <div className="tile-editor-canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: 'crosshair', maxWidth: '100%', imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
}

export function BackgroundPanel() {
  const {
    gameData,
    createTileset,
    deleteTileset,
    createBackground,
    updateBackground,
    deleteBackground,
    getImageUrl
  } = useStudio();

  const [selectedTilesetId, setSelectedTilesetId] = useState(null);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(null);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [selectedTile, setSelectedTile] = useState(1);

  // New tileset form
  const [showNewTileset, setShowNewTileset] = useState(false);
  const [newTilesetName, setNewTilesetName] = useState('');
  const [newTilesetImageId, setNewTilesetImageId] = useState('');
  const [newTilesetTileSize, setNewTilesetTileSize] = useState(32);

  // New background form
  const [showNewBackground, setShowNewBackground] = useState(false);
  const [newBackgroundName, setNewBackgroundName] = useState('');
  const [newBackgroundWidth, setNewBackgroundWidth] = useState(20);
  const [newBackgroundHeight, setNewBackgroundHeight] = useState(15);

  const tilesets = gameData?.tilesets || [];
  const backgrounds = gameData?.backgrounds || [];
  const images = gameData?.images || [];

  const selectedTileset = tilesets.find(t => t.id === selectedTilesetId);
  const selectedBackground = backgrounds.find(b => b.id === selectedBackgroundId);
  const backgroundTileset = selectedBackground
    ? tilesets.find(t => t.id === selectedBackground.tilesetId)
    : null;

  // Auto-select first layer when background changes
  useEffect(() => {
    if (selectedBackground?.layers?.length > 0 && !selectedLayerId) {
      setSelectedLayerId(selectedBackground.layers[0].id);
    }
  }, [selectedBackground, selectedLayerId]);

  const handleCreateTileset = async () => {
    if (!newTilesetName.trim() || !newTilesetImageId) return;
    const tileset = await createTileset({
      name: newTilesetName.trim(),
      imageId: newTilesetImageId,
      tileWidth: newTilesetTileSize,
      tileHeight: newTilesetTileSize
    });
    if (tileset) {
      setSelectedTilesetId(tileset.id);
      setShowNewTileset(false);
      setNewTilesetName('');
      setNewTilesetImageId('');
    }
  };

  const handleCreateBackground = async () => {
    if (!newBackgroundName.trim() || !selectedTilesetId) return;
    const background = await createBackground({
      name: newBackgroundName.trim(),
      width: newBackgroundWidth,
      height: newBackgroundHeight,
      tilesetId: selectedTilesetId
    });
    if (background) {
      setSelectedBackgroundId(background.id);
      setSelectedLayerId(background.layers[0]?.id);
      setShowNewBackground(false);
      setNewBackgroundName('');
    }
  };

  const handleDeleteTileset = async (id) => {
    if (confirm('Delete this tileset? Backgrounds using it will break.')) {
      await deleteTileset(id);
      if (selectedTilesetId === id) setSelectedTilesetId(null);
    }
  };

  const handleDeleteBackground = async (id) => {
    if (confirm('Delete this background?')) {
      await deleteBackground(id);
      if (selectedBackgroundId === id) {
        setSelectedBackgroundId(null);
        setSelectedLayerId(null);
      }
    }
  };

  const handleUpdateBackground = async (updated) => {
    await updateBackground(updated.id, updated);
  };

  const addLayer = async () => {
    if (!selectedBackground) return;
    const newLayer = {
      id: `layer_${Date.now()}`,
      name: `Layer ${selectedBackground.layers.length + 1}`,
      visible: true,
      data: new Array(selectedBackground.width * selectedBackground.height).fill(0)
    };
    await handleUpdateBackground({
      ...selectedBackground,
      layers: [...selectedBackground.layers, newLayer]
    });
    setSelectedLayerId(newLayer.id);
  };

  const toggleLayerVisibility = async (layerId) => {
    if (!selectedBackground) return;
    await handleUpdateBackground({
      ...selectedBackground,
      layers: selectedBackground.layers.map(l =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      )
    });
  };

  const deleteLayer = async (layerId) => {
    if (!selectedBackground || selectedBackground.layers.length <= 1) return;
    if (!confirm('Delete this layer?')) return;

    const newLayers = selectedBackground.layers.filter(l => l.id !== layerId);
    await handleUpdateBackground({
      ...selectedBackground,
      layers: newLayers
    });
    if (selectedLayerId === layerId) {
      setSelectedLayerId(newLayers[0]?.id);
    }
  };

  return (
    <div className="background-panel-container">
      {/* Left column - Tilesets */}
      <div className="tileset-column">
        <div className="column-header">
          <h3>Tilesets</h3>
          <button className="small" onClick={() => setShowNewTileset(true)}>+ Add</button>
        </div>

        {showNewTileset && (
          <div className="inline-form">
            <input
              type="text"
              value={newTilesetName}
              onChange={(e) => setNewTilesetName(e.target.value)}
              placeholder="Tileset name..."
              autoFocus
            />
            <select
              value={newTilesetImageId}
              onChange={(e) => setNewTilesetImageId(e.target.value)}
            >
              <option value="">Select image...</option>
              {images.map(img => (
                <option key={img.id} value={img.id}>{img.name}</option>
              ))}
            </select>
            <div className="form-row-inline">
              <label>Tile size:</label>
              <input
                type="number"
                value={newTilesetTileSize}
                onChange={(e) => setNewTilesetTileSize(parseInt(e.target.value) || 32)}
                style={{ width: '60px' }}
              />
            </div>
            <div className="button-row">
              <button className="small" onClick={handleCreateTileset}>Create</button>
              <button className="small secondary" onClick={() => setShowNewTileset(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="tileset-list">
          {tilesets.map(tileset => (
            <div
              key={tileset.id}
              className={`tileset-list-item ${selectedTilesetId === tileset.id ? 'selected' : ''}`}
              onClick={() => setSelectedTilesetId(tileset.id)}
            >
              <div className="tileset-list-info">
                <span className="tileset-list-name">{tileset.name}</span>
                <span className="tileset-list-meta">
                  {tileset.tileWidth}x{tileset.tileHeight} ({tileset.tileCount} tiles)
                </span>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => { e.stopPropagation(); handleDeleteTileset(tileset.id); }}
              >
                x
              </button>
            </div>
          ))}
          {tilesets.length === 0 && (
            <div className="empty-list">
              <p>No tilesets yet</p>
              <p className="hint">Upload an image first, then create a tileset from it</p>
            </div>
          )}
        </div>

        {selectedTileset && (
          <TilePalette
            tileset={selectedTileset}
            selectedTile={selectedTile}
            onSelectTile={setSelectedTile}
            getImageUrl={getImageUrl}
          />
        )}
      </div>

      {/* Middle column - Backgrounds + Layers */}
      <div className="background-list-column">
        <div className="column-header">
          <h3>Backgrounds</h3>
          <button
            className="small"
            onClick={() => setShowNewBackground(true)}
            disabled={tilesets.length === 0}
          >
            + Add
          </button>
        </div>

        {showNewBackground && (
          <div className="inline-form">
            <input
              type="text"
              value={newBackgroundName}
              onChange={(e) => setNewBackgroundName(e.target.value)}
              placeholder="Background name..."
              autoFocus
            />
            <div className="form-row-inline">
              <label>Size:</label>
              <input
                type="number"
                value={newBackgroundWidth}
                onChange={(e) => setNewBackgroundWidth(parseInt(e.target.value) || 20)}
                style={{ width: '50px' }}
              />
              <span>x</span>
              <input
                type="number"
                value={newBackgroundHeight}
                onChange={(e) => setNewBackgroundHeight(parseInt(e.target.value) || 15)}
                style={{ width: '50px' }}
              />
              <span>tiles</span>
            </div>
            <div className="button-row">
              <button className="small" onClick={handleCreateBackground}>Create</button>
              <button className="small secondary" onClick={() => setShowNewBackground(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="background-list">
          {backgrounds.map(bg => (
            <div
              key={bg.id}
              className={`background-list-item ${selectedBackgroundId === bg.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedBackgroundId(bg.id);
                setSelectedLayerId(bg.layers[0]?.id);
                // Also select the tileset this background uses
                setSelectedTilesetId(bg.tilesetId);
              }}
            >
              <div className="background-list-info">
                <span className="background-list-name">{bg.name}</span>
                <span className="background-list-meta">
                  {bg.width}x{bg.height} | {bg.layers.length} layers
                </span>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => { e.stopPropagation(); handleDeleteBackground(bg.id); }}
              >
                x
              </button>
            </div>
          ))}
          {backgrounds.length === 0 && (
            <div className="empty-list">
              <p>No backgrounds yet</p>
              <p className="hint">Create a tileset first</p>
            </div>
          )}
        </div>

        {/* Layers section */}
        {selectedBackground && (
          <div className="layers-section">
            <div className="column-header">
              <h3>Layers</h3>
              <button className="small" onClick={addLayer}>+ Add</button>
            </div>
            <div className="layer-list">
              {selectedBackground.layers.map((layer, index) => (
                <div
                  key={layer.id}
                  className={`layer-list-item ${selectedLayerId === layer.id ? 'selected' : ''}`}
                  onClick={() => setSelectedLayerId(layer.id)}
                >
                  <button
                    className="visibility-btn"
                    onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                  >
                    {layer.visible ? '👁' : '○'}
                  </button>
                  <span className="layer-name">{layer.name}</span>
                  {selectedBackground.layers.length > 1 && (
                    <button
                      className="delete-btn"
                      onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                    >
                      x
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right column - Tile Editor */}
      <div className="tile-editor-column">
        <div className="column-header">
          <h3>
            {selectedBackground ? `Editing: ${selectedBackground.name}` : 'Tile Editor'}
          </h3>
        </div>
        <TileEditor
          background={selectedBackground}
          tileset={backgroundTileset}
          selectedTile={selectedTile}
          selectedLayerId={selectedLayerId}
          onUpdateBackground={handleUpdateBackground}
          getImageUrl={getImageUrl}
        />
      </div>
    </div>
  );
}
