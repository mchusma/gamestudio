import { useState, useRef, useEffect } from 'react';
import { useStudio } from '../context/StudioContext';
import { generateObjectCode } from '../services/luaGenerator';

function StatePreview({ state, gameData, getImageUrl, getAnimationUrl }) {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const loadedImagesRef = useRef([]);

  // Get visual data
  const visualType = state.visualType; // 'image' or 'animation'
  const visualId = state.visualId;

  let images = [];
  let frameDuration = 0.1;

  if (visualType === 'image') {
    const img = gameData.images.find(i => i.id === visualId);
    if (img) images = [img];
  } else if (visualType === 'animation') {
    const anim = gameData.animations.find(a => a.id === visualId);
    if (anim) {
      images = anim.sourceImages
        ?.map(id => gameData.images.find(i => i.id === id))
        .filter(Boolean) || [];
      frameDuration = anim.frameDuration;
    }
  }

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
        frameRef.current = (frameRef.current + 1) % loadedImagesRef.current.length;
      }

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

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, images.length, frameDuration]);

  if (images.length === 0) {
    return <span style={{ color: 'var(--text-secondary)' }}>No visual</span>;
  }

  return (
    <canvas
      ref={canvasRef}
      width={48}
      height={48}
      style={{
        border: '1px solid var(--border)',
        borderRadius: 4,
        background: 'var(--bg-tertiary)'
      }}
    />
  );
}

function StateEditorModal({ state, onSave, onCancel }) {
  const { gameData, getSoundUrl } = useStudio();
  const [name, setName] = useState(state?.name || '');
  const [visualType, setVisualType] = useState(state?.visualType || 'image');
  const [visualId, setVisualId] = useState(state?.visualId || '');
  const [soundId, setSoundId] = useState(state?.soundId || '');
  const audioRef = useRef(null);

  const images = gameData?.images || [];
  const animations = gameData?.animations || [];
  const sounds = gameData?.sounds || [];

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      ...state,
      name: name.trim(),
      visualType,
      visualId: visualId || null,
      soundId: soundId || null
    });
  };

  const playSound = () => {
    if (!soundId) return;
    const sound = sounds.find(s => s.id === soundId);
    if (!sound) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(getSoundUrl(sound.filename));
    audio.play();
    audioRef.current = audio;
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{state?.id ? 'Edit State' : 'Add State'}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="animation-form">
          <div className="form-group">
            <label>State Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., idle, walking, jumping"
            />
          </div>

          <div className="form-group">
            <label>Visual Type</label>
            <select value={visualType} onChange={(e) => {
              setVisualType(e.target.value);
              setVisualId('');
            }}>
              <option value="image">Single Image</option>
              <option value="animation">Animation</option>
            </select>
          </div>

          <div className="form-group">
            <label>{visualType === 'image' ? 'Image' : 'Animation'}</label>
            <select value={visualId} onChange={(e) => setVisualId(e.target.value)}>
              <option value="">-- None --</option>
              {visualType === 'image'
                ? images.map(img => (
                    <option key={img.id} value={img.id}>{img.name}</option>
                  ))
                : animations.map(anim => (
                    <option key={anim.id} value={anim.id}>{anim.name}</option>
                  ))
              }
            </select>
          </div>

          <div className="form-group">
            <label>Sound (plays when entering state)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={soundId}
                onChange={(e) => setSoundId(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">-- None --</option>
                {sounds.map(sound => (
                  <option key={sound.id} value={sound.id}>{sound.name}</option>
                ))}
              </select>
              {soundId && (
                <button className="small secondary" onClick={playSound}>
                  ▶ Test
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="secondary" onClick={onCancel}>Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()}>
            {state?.id ? 'Save' : 'Add State'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ObjectCard({ object, expanded, onToggle, onUpdate, onDelete }) {
  const { gameData, getImageUrl, getAnimationUrl, getSoundUrl } = useStudio();
  const [editingState, setEditingState] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(object.name);

  const addState = () => {
    setEditingState({ id: null });
  };

  const editState = (state) => {
    setEditingState(state);
  };

  const saveState = (stateData) => {
    let newStates;
    if (stateData.id) {
      newStates = object.states.map(s => s.id === stateData.id ? stateData : s);
    } else {
      newStates = [...object.states, { ...stateData, id: `state_${Date.now()}` }];
    }
    onUpdate({ ...object, states: newStates });
    setEditingState(null);
  };

  const deleteState = (stateId) => {
    if (confirm('Delete this state?')) {
      onUpdate({
        ...object,
        states: object.states.filter(s => s.id !== stateId)
      });
    }
  };

  const saveName = () => {
    if (nameValue.trim() && nameValue !== object.name) {
      onUpdate({ ...object, name: nameValue.trim() });
    }
    setEditingName(false);
  };

  const copyCode = () => {
    const code = generateObjectCode(object, gameData);
    navigator.clipboard.writeText(code);
    alert('Lua code copied to clipboard!');
  };

  const getVisualName = (state) => {
    if (!state.visualId) return 'none';
    if (state.visualType === 'image') {
      const img = gameData.images.find(i => i.id === state.visualId);
      return img ? img.name : 'unknown';
    } else {
      const anim = gameData.animations.find(a => a.id === state.visualId);
      return anim ? anim.name : 'unknown';
    }
  };

  const getSoundName = (state) => {
    if (!state.soundId) return null;
    const sound = gameData.sounds.find(s => s.id === state.soundId);
    return sound ? sound.name : null;
  };

  return (
    <div className="object-card">
      <div className="object-card-header" onClick={onToggle}>
        <div className="object-card-name">
          <span>{expanded ? '▼' : '▶'}</span>
          {editingName ? (
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName();
                if (e.key === 'Escape') {
                  setNameValue(object.name);
                  setEditingName(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--accent)',
                borderRadius: 4,
                padding: '2px 8px',
                color: 'var(--text-primary)'
              }}
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingName(true);
              }}
            >
              {object.name}
            </span>
          )}
          <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', fontSize: 12 }}>
            ({object.states.length} states)
          </span>
        </div>
        <div className="panel-actions" onClick={(e) => e.stopPropagation()}>
          <button className="small secondary" onClick={() => setShowCode(!showCode)}>
            {showCode ? 'Hide Code' : 'Show Code'}
          </button>
          <button className="small danger" onClick={() => onDelete(object.id)}>
            Delete
          </button>
        </div>
      </div>

      {expanded && (
        <div className="object-card-body">
          {showCode && (
            <div className="code-export" style={{ marginBottom: 16 }}>
              <div className="code-export-header">
                <span>{object.name}.lua</span>
                <button className="small" onClick={copyCode}>Copy</button>
              </div>
              <pre>{generateObjectCode(object, gameData)}</pre>
            </div>
          )}

          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>States</strong>
            <button className="small" onClick={addState}>+ Add State</button>
          </div>

          {object.states.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>
              No states yet. Add a state to define how this object looks and sounds.
            </p>
          ) : (
            <div className="state-list">
              {object.states.map((state) => (
                <div key={state.id} className="state-item">
                  <StatePreview
                    state={state}
                    gameData={gameData}
                    getImageUrl={getImageUrl}
                    getAnimationUrl={getAnimationUrl}
                  />
                  <span className="state-item-name">{state.name}</span>
                  <span className="state-item-visual">
                    {state.visualType === 'animation' ? '🎬' : '🖼️'} {getVisualName(state)}
                  </span>
                  {getSoundName(state) && (
                    <span className="state-item-sound">
                      🔊 {getSoundName(state)}
                    </span>
                  )}
                  <div className="state-item-actions">
                    <button className="small secondary" onClick={() => editState(state)}>
                      Edit
                    </button>
                    <button className="small danger" onClick={() => deleteState(state.id)}>
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editingState && (
        <StateEditorModal
          state={editingState}
          onSave={saveState}
          onCancel={() => setEditingState(null)}
        />
      )}
    </div>
  );
}

export function ObjectPanel() {
  const { gameData, saveObjects } = useStudio();
  const [expandedId, setExpandedId] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');

  const objects = gameData?.objects || [];

  const createObject = () => {
    if (!newName.trim()) return;
    const newObject = {
      id: `obj_${Date.now()}`,
      name: newName.trim(),
      states: [],
      createdAt: new Date().toISOString()
    };
    saveObjects([...objects, newObject]);
    setNewName('');
    setShowNewForm(false);
    setExpandedId(newObject.id);
  };

  const updateObject = (updated) => {
    saveObjects(objects.map(o => o.id === updated.id ? updated : o));
  };

  const deleteObject = (id) => {
    if (confirm('Delete this object and all its states?')) {
      saveObjects(objects.filter(o => o.id !== id));
    }
  };

  return (
    <div className="content-panel">
      <div className="panel-header">
        <h2>Objects</h2>
        <div className="panel-actions">
          {!showNewForm ? (
            <button onClick={() => setShowNewForm(true)}>+ New Object</button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Object name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createObject();
                  if (e.key === 'Escape') setShowNewForm(false);
                }}
                autoFocus
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  color: 'var(--text-primary)'
                }}
              />
              <button onClick={createObject}>Create</button>
              <button className="secondary" onClick={() => setShowNewForm(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      {objects.length === 0 && !showNewForm ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <p>No objects yet</p>
          <p>Create an object to define game entities with states</p>
        </div>
      ) : (
        <div className="object-list">
          {objects.map((obj) => (
            <ObjectCard
              key={obj.id}
              object={obj}
              expanded={expandedId === obj.id}
              onToggle={() => setExpandedId(expandedId === obj.id ? null : obj.id)}
              onUpdate={updateObject}
              onDelete={deleteObject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
