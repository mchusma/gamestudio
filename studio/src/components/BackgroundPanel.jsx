import { useState, useRef, useEffect, useCallback } from 'react';
import { useStudio } from '../context/StudioContext';
import { api } from '../services/api';

// Background preview canvas
function BackgroundPreview({ background, tileset, getImageUrl }) {
  const { gameData } = useStudio();
  const canvasRef = useRef(null);
  const tilesetImageRef = useRef(null);

  const sourceImage = gameData?.images?.find(i => i.id === tileset?.imageId);

  useEffect(() => {
    if (!sourceImage || !tileset) return;
    const img = new Image();
    img.src = getImageUrl(sourceImage.filename);
    img.onload = () => {
      tilesetImageRef.current = img;
      drawCanvas();
    };
  }, [sourceImage, tileset, getImageUrl]);

  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !background || !tileset || !tilesetImageRef.current) return;

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
    if (background.layers) {
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
  }, [background, tileset]);

  useEffect(() => {
    if (tilesetImageRef.current) {
      drawCanvas();
    }
  }, [drawCanvas, background?.layers]);

  if (!background || !tileset) {
    return (
      <div className="background-preview-empty">
        <p>No background selected</p>
        <p className="hint">Use the chat to create one</p>
      </div>
    );
  }

  return (
    <div className="background-preview">
      <div className="background-preview-header">
        <span>{background.name}</span>
        <span className="meta">{background.width}x{background.height} tiles</span>
      </div>
      <div className="background-preview-canvas">
        <canvas
          ref={canvasRef}
          style={{ maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
}

// Tileset thumbnail
function TilesetThumb({ tileset, getImageUrl, onClick, selected }) {
  const { gameData } = useStudio();
  const sourceImage = gameData?.images?.find(i => i.id === tileset?.imageId);

  return (
    <div
      className={`tileset-thumb ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {sourceImage ? (
        <img src={getImageUrl(sourceImage.filename)} alt={tileset.name} />
      ) : (
        <div className="tileset-thumb-placeholder">?</div>
      )}
      <span>{tileset.name}</span>
    </div>
  );
}

export function BackgroundPanel() {
  const {
    gameData,
    currentGame,
    createTileset,
    deleteTileset,
    createBackground,
    updateBackground,
    deleteBackground,
    uploadImageFromUrl,
    getImageUrl
  } = useStudio();

  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [generating, setGenerating] = useState(false);
  const messagesEndRef = useRef(null);

  // Selection state
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(null);
  const [selectedTilesetId, setSelectedTilesetId] = useState(null);

  const tilesets = gameData?.tilesets || [];
  const backgrounds = gameData?.backgrounds || [];
  const selectedBackground = backgrounds.find(b => b.id === selectedBackgroundId);
  const selectedTileset = selectedBackground
    ? tilesets.find(t => t.id === selectedBackground.tilesetId)
    : tilesets.find(t => t.id === selectedTilesetId);

  // Auto-select first background
  useEffect(() => {
    if (!selectedBackgroundId && backgrounds.length > 0) {
      setSelectedBackgroundId(backgrounds[0].id);
    }
  }, [backgrounds, selectedBackgroundId]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || generating) return;

    const userMessage = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setGenerating(true);

    try {
      const response = await api.generateBackground(currentGame, {
        prompt: inputText,
        history: messages,
        currentBackground: selectedBackground,
        currentTileset: selectedTileset
      });

      if (response.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.error,
          isError: true
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.text || '',
          images: response.images || [],
          tileData: response.tileData
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Failed to connect to the AI service.',
        isError: true
      }]);
    }

    setGenerating(false);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Use generated tileset image
  const handleUseTileset = async (imageUrl, tileSize = 32) => {
    try {
      // Upload the image
      const image = await uploadImageFromUrl(imageUrl, `tileset-${Date.now()}`);
      if (!image) return;

      // Create tileset from it
      const tileset = await createTileset({
        name: `Tileset ${tilesets.length + 1}`,
        imageId: image.id,
        tileWidth: tileSize,
        tileHeight: tileSize
      });

      if (tileset) {
        setSelectedTilesetId(tileset.id);
        setMessages(prev => [...prev, {
          role: 'system',
          content: `Created tileset "${tileset.name}" with ${tileset.tileCount} tiles.`
        }]);
      }
    } catch (error) {
      console.error('Failed to create tileset:', error);
    }
  };

  // Apply tile data from AI response
  const handleApplyTileData = async (tileData) => {
    if (!selectedBackground || !tileData) return;

    const layerName = tileData.layer || 'Layer 1';
    const layer = selectedBackground.layers.find(l => l.name === layerName);

    if (layer && tileData.data) {
      const updatedLayers = selectedBackground.layers.map(l =>
        l.name === layerName ? { ...l, data: tileData.data } : l
      );
      await updateBackground(selectedBackground.id, {
        ...selectedBackground,
        layers: updatedLayers
      });
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Applied tile data to ${layerName}.`
      }]);
    }
  };

  // Quick create background
  const handleQuickCreate = async () => {
    if (tilesets.length === 0) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Create a tileset first by asking me to generate one!'
      }]);
      return;
    }

    const bg = await createBackground({
      name: `Background ${backgrounds.length + 1}`,
      width: 20,
      height: 15,
      tilesetId: selectedTilesetId || tilesets[0].id
    });

    if (bg) {
      setSelectedBackgroundId(bg.id);
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Created background "${bg.name}" (20x15 tiles).`
      }]);
    }
  };

  return (
    <div className="background-panel-chat">
      {/* Left side - Chat interface */}
      <div className="background-chat-column">
        <div className="chat-header">
          <h3>Background Designer</h3>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-placeholder">
              <div className="chat-placeholder-icon">🎨</div>
              <p>Describe the background you want to create</p>
              <p className="hint">I can generate tileset images and arrange tiles for you</p>
              <div className="chat-suggestions">
                <button onClick={() => setInputText('Create a forest tileset with grass, trees, and paths')}>
                  Forest tileset
                </button>
                <button onClick={() => setInputText('Create a dungeon tileset with stone walls and floors')}>
                  Dungeon tileset
                </button>
                <button onClick={() => setInputText('Create a simple platformer tileset')}>
                  Platformer tileset
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              {msg.role === 'user' ? (
                <div className="message-content user-message">
                  {msg.content}
                </div>
              ) : msg.role === 'system' ? (
                <div className="message-content system-message">
                  {msg.content}
                </div>
              ) : (
                <div className="message-content assistant-message">
                  {msg.isError ? (
                    <span className="error-text">{msg.content}</span>
                  ) : (
                    <>
                      {msg.content && <p>{msg.content}</p>}
                      {msg.images && msg.images.length > 0 && (
                        <div className="generated-tilesets">
                          {msg.images.map((img, j) => (
                            <div key={j} className="generated-tileset-item">
                              <img src={img.url} alt={img.alt || 'Generated tileset'} />
                              <div className="tileset-actions">
                                <button
                                  className="small"
                                  onClick={() => handleUseTileset(img.url, 32)}
                                >
                                  Use as 32px tileset
                                </button>
                                <button
                                  className="small secondary"
                                  onClick={() => handleUseTileset(img.url, 16)}
                                >
                                  16px
                                </button>
                                <button
                                  className="small secondary"
                                  onClick={() => handleUseTileset(img.url, 64)}
                                >
                                  64px
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.tileData && (
                        <div className="tile-data-actions">
                          <p className="hint">Tile arrangement ready</p>
                          <button
                            className="small"
                            onClick={() => handleApplyTileData(msg.tileData)}
                            disabled={!selectedBackground}
                          >
                            Apply to background
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          {generating && (
            <div className="chat-message assistant">
              <div className="message-content assistant-message">
                <span className="generating-indicator">Generating...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the background you want..."
            rows={2}
            disabled={generating}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || generating}
          >
            Send
          </button>
        </div>
      </div>

      {/* Right side - Preview + Assets */}
      <div className="background-preview-column">
        {/* Tilesets section */}
        <div className="tilesets-section">
          <div className="section-header">
            <h4>Tilesets</h4>
          </div>
          <div className="tilesets-grid">
            {tilesets.map(ts => (
              <TilesetThumb
                key={ts.id}
                tileset={ts}
                getImageUrl={getImageUrl}
                selected={selectedTilesetId === ts.id || selectedTileset?.id === ts.id}
                onClick={() => setSelectedTilesetId(ts.id)}
              />
            ))}
            {tilesets.length === 0 && (
              <div className="empty-hint">
                Ask me to generate a tileset
              </div>
            )}
          </div>
        </div>

        {/* Backgrounds section */}
        <div className="backgrounds-section">
          <div className="section-header">
            <h4>Backgrounds</h4>
            <button
              className="small"
              onClick={handleQuickCreate}
              disabled={tilesets.length === 0}
            >
              + New
            </button>
          </div>
          <div className="backgrounds-list">
            {backgrounds.map(bg => (
              <div
                key={bg.id}
                className={`background-item ${selectedBackgroundId === bg.id ? 'selected' : ''}`}
                onClick={() => setSelectedBackgroundId(bg.id)}
              >
                <span className="bg-name">{bg.name}</span>
                <span className="bg-size">{bg.width}x{bg.height}</span>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this background?')) {
                      deleteBackground(bg.id);
                      if (selectedBackgroundId === bg.id) {
                        setSelectedBackgroundId(null);
                      }
                    }
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            {backgrounds.length === 0 && (
              <div className="empty-hint">
                {tilesets.length === 0
                  ? 'Generate a tileset first'
                  : 'Click + New to create a background'}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="preview-section">
          <BackgroundPreview
            background={selectedBackground}
            tileset={selectedTileset}
            getImageUrl={getImageUrl}
          />
        </div>
      </div>
    </div>
  );
}
