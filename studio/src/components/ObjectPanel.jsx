import { useState, useRef, useEffect } from 'react';
import { useStudio } from '../context/StudioContext';

// Animated preview that shows the visual and can play sound
function StatePreview({ state, gameData, getImageUrl, getSoundUrl }) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const audioRef = useRef(null);

  // Get visual data
  let frames = [];
  let frameDuration = 0.1;

  if (state?.visualType === 'image' && state?.visualId) {
    const img = gameData?.images?.find(i => i.id === state.visualId);
    if (img) frames = [img];
  } else if (state?.visualType === 'animation' && state?.visualId) {
    const anim = gameData?.animations?.find(a => a.id === state.visualId);
    if (anim) {
      frames = (anim.sourceImages || [])
        .map(id => gameData?.images?.find(i => i.id === id))
        .filter(Boolean);
      frameDuration = anim.frameDuration || 0.1;
    }
  }

  // Animation loop
  useEffect(() => {
    if (frames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % frames.length);
    }, frameDuration * 1000);

    return () => clearInterval(interval);
  }, [frames.length, frameDuration]);

  // Reset frame when state changes
  useEffect(() => {
    setCurrentFrame(0);
  }, [state?.id, state?.visualId]);

  const playSound = () => {
    if (!state?.soundId) return;
    const sound = gameData?.sounds?.find(s => s.id === state.soundId);
    if (!sound) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(getSoundUrl(sound.filename));
    audio.onended = () => setIsPlayingSound(false);
    audio.play();
    audioRef.current = audio;
    setIsPlayingSound(true);
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayingSound(false);
  };

  const currentImg = frames[currentFrame];
  const sound = state?.soundId ? gameData?.sounds?.find(s => s.id === state.soundId) : null;

  return (
    <div className="state-preview-container">
      <div className="state-preview-visual">
        {currentImg ? (
          <img
            src={getImageUrl(currentImg.filename)}
            alt={state?.name || 'Preview'}
            className="state-preview-img"
          />
        ) : (
          <div className="state-preview-placeholder">No visual</div>
        )}
      </div>
      {sound && (
        <div className="state-preview-sound">
          <button
            className="sound-play-btn"
            onClick={isPlayingSound ? stopSound : playSound}
          >
            {isPlayingSound ? '⏹' : '▶'} {sound.name}
          </button>
        </div>
      )}
      {frames.length > 1 && (
        <div className="state-preview-info">
          Frame {currentFrame + 1} of {frames.length}
        </div>
      )}
    </div>
  );
}

export function ObjectPanel() {
  const { gameData, saveObjects, getImageUrl, getSoundUrl } = useStudio();

  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [objectSearch, setObjectSearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [showNewObjectInput, setShowNewObjectInput] = useState(false);
  const [newObjectName, setNewObjectName] = useState('');
  const [showNewStateInput, setShowNewStateInput] = useState(false);
  const [newStateName, setNewStateName] = useState('');

  const objects = gameData?.objects || [];
  const images = gameData?.images || [];
  const animations = gameData?.animations || [];
  const sounds = gameData?.sounds || [];

  // Combined visuals list for dropdown
  const visuals = [
    ...images.map(img => ({ type: 'image', id: img.id, name: img.name })),
    ...animations.map(anim => ({ type: 'animation', id: anim.id, name: anim.name }))
  ];

  const filteredObjects = objects.filter(obj =>
    obj.name.toLowerCase().includes(objectSearch.toLowerCase())
  );

  const selectedObject = objects.find(o => o.id === selectedObjectId);
  const filteredStates = (selectedObject?.states || []).filter(state =>
    state.name.toLowerCase().includes(stateSearch.toLowerCase())
  );
  const selectedState = selectedObject?.states?.find(s => s.id === selectedStateId);

  // Object CRUD
  const createObject = () => {
    if (!newObjectName.trim()) return;
    const newObject = {
      id: `obj_${Date.now()}`,
      name: newObjectName.trim(),
      states: [{ id: `state_${Date.now()}`, name: 'default', visualType: null, visualId: null, soundId: null }],
      createdAt: new Date().toISOString()
    };
    saveObjects([...objects, newObject]);
    setNewObjectName('');
    setShowNewObjectInput(false);
    setSelectedObjectId(newObject.id);
    setSelectedStateId(newObject.states[0].id);
  };

  const deleteObject = (id) => {
    if (confirm('Delete this object and all its states?')) {
      saveObjects(objects.filter(o => o.id !== id));
      if (selectedObjectId === id) {
        setSelectedObjectId(null);
        setSelectedStateId(null);
      }
    }
  };

  // State CRUD
  const createState = () => {
    if (!newStateName.trim() || !selectedObject) return;
    const newState = {
      id: `state_${Date.now()}`,
      name: newStateName.trim(),
      visualType: null,
      visualId: null,
      soundId: null
    };
    const updated = {
      ...selectedObject,
      states: [...selectedObject.states, newState]
    };
    saveObjects(objects.map(o => o.id === updated.id ? updated : o));
    setNewStateName('');
    setShowNewStateInput(false);
    setSelectedStateId(newState.id);
  };

  const deleteState = (stateId) => {
    if (!selectedObject) return;
    if (selectedObject.states.length <= 1) {
      alert('Object must have at least one state');
      return;
    }
    if (confirm('Delete this state?')) {
      const updated = {
        ...selectedObject,
        states: selectedObject.states.filter(s => s.id !== stateId)
      };
      saveObjects(objects.map(o => o.id === updated.id ? updated : o));
      if (selectedStateId === stateId) {
        setSelectedStateId(updated.states[0]?.id || null);
      }
    }
  };

  const updateState = (field, value) => {
    if (!selectedObject || !selectedState) return;

    let updatedState = { ...selectedState, [field]: value };

    // If changing visual, parse the combined value
    if (field === 'visual') {
      if (!value) {
        updatedState.visualType = null;
        updatedState.visualId = null;
      } else {
        const [type, id] = value.split(':');
        updatedState.visualType = type;
        updatedState.visualId = id;
      }
    }

    const updated = {
      ...selectedObject,
      states: selectedObject.states.map(s => s.id === selectedState.id ? updatedState : s)
    };
    saveObjects(objects.map(o => o.id === updated.id ? updated : o));
  };

  const updateStateName = (newName) => {
    if (!selectedObject || !selectedState || !newName.trim()) return;
    const updated = {
      ...selectedObject,
      states: selectedObject.states.map(s =>
        s.id === selectedState.id ? { ...s, name: newName.trim() } : s
      )
    };
    saveObjects(objects.map(o => o.id === updated.id ? updated : o));
  };

  const updateObjectName = (newName) => {
    if (!selectedObject || !newName.trim()) return;
    const updated = { ...selectedObject, name: newName.trim() };
    saveObjects(objects.map(o => o.id === updated.id ? updated : o));
  };

  // Get current visual value for dropdown
  const currentVisualValue = selectedState?.visualType && selectedState?.visualId
    ? `${selectedState.visualType}:${selectedState.visualId}`
    : '';

  return (
    <div className="object-panel-container">
      {/* Left column - Objects list */}
      <div className="object-list-column">
        <div className="column-header">
          <h3>Objects</h3>
          <button className="small" onClick={() => setShowNewObjectInput(true)}>
            + Add
          </button>
        </div>

        {showNewObjectInput && (
          <div className="inline-add-form">
            <input
              type="text"
              value={newObjectName}
              onChange={(e) => setNewObjectName(e.target.value)}
              placeholder="Object name..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') createObject();
                if (e.key === 'Escape') {
                  setShowNewObjectInput(false);
                  setNewObjectName('');
                }
              }}
              autoFocus
            />
            <button className="small" onClick={createObject}>Add</button>
            <button className="small secondary" onClick={() => {
              setShowNewObjectInput(false);
              setNewObjectName('');
            }}>×</button>
          </div>
        )}

        <div className="list-search">
          <input
            type="text"
            placeholder="Search objects..."
            value={objectSearch}
            onChange={(e) => setObjectSearch(e.target.value)}
          />
        </div>

        <div className="object-list">
          {filteredObjects.map((obj) => (
            <div
              key={obj.id}
              className={`object-list-item ${selectedObjectId === obj.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedObjectId(obj.id);
                setSelectedStateId(obj.states[0]?.id || null);
                setStateSearch('');
              }}
            >
              <div className="object-list-info">
                <span className="object-list-name">{obj.name}</span>
                <span className="object-list-meta">{obj.states.length} states</span>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteObject(obj.id);
                }}
              >
                ×
              </button>
            </div>
          ))}

          {objects.length === 0 && (
            <div className="empty-list">
              <p>No objects yet</p>
              <p className="hint">Click + Add to create</p>
            </div>
          )}
        </div>
      </div>

      {/* Middle column - States list */}
      {selectedObject && (
        <div className="state-list-column">
          <div className="column-header">
            <h3>States</h3>
            <button className="small" onClick={() => setShowNewStateInput(true)}>
              + Add
            </button>
          </div>

          {showNewStateInput && (
            <div className="inline-add-form">
              <input
                type="text"
                value={newStateName}
                onChange={(e) => setNewStateName(e.target.value)}
                placeholder="State name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createState();
                  if (e.key === 'Escape') {
                    setShowNewStateInput(false);
                    setNewStateName('');
                  }
                }}
                autoFocus
              />
              <button className="small" onClick={createState}>Add</button>
              <button className="small secondary" onClick={() => {
                setShowNewStateInput(false);
                setNewStateName('');
              }}>×</button>
            </div>
          )}

          <div className="list-search">
            <input
              type="text"
              placeholder="Search states..."
              value={stateSearch}
              onChange={(e) => setStateSearch(e.target.value)}
            />
          </div>

          <div className="state-list">
            {filteredStates.map((state) => (
              <div
                key={state.id}
                className={`state-list-item ${selectedStateId === state.id ? 'selected' : ''}`}
                onClick={() => setSelectedStateId(state.id)}
              >
                <div className="state-list-info">
                  <span className="state-list-name">{state.name}</span>
                  <span className="state-list-meta">
                    {state.visualType === 'animation' ? '🎬' : state.visualType === 'image' ? '🖼️' : ''}
                    {state.soundId ? ' 🔊' : ''}
                  </span>
                </div>
                {selectedObject.states.length > 1 && (
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteState(state.id);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Right column - State editor with preview */}
      {selectedState && (
        <div className="state-editor-column">
          <div className="column-header">
            <h3>Edit State</h3>
          </div>

          <StatePreview
            state={selectedState}
            gameData={gameData}
            getImageUrl={getImageUrl}
            getSoundUrl={getSoundUrl}
          />

          <div className="state-editor-form">
            <div className="form-group">
              <label>Object Name</label>
              <input
                type="text"
                value={selectedObject?.name || ''}
                onChange={(e) => updateObjectName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>State Name</label>
              <input
                type="text"
                value={selectedState.name}
                onChange={(e) => updateStateName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Visual (Image or Animation)</label>
              <select
                value={currentVisualValue}
                onChange={(e) => updateState('visual', e.target.value)}
              >
                <option value="">-- None --</option>
                <optgroup label="Images">
                  {images.map(img => (
                    <option key={img.id} value={`image:${img.id}`}>
                      🖼️ {img.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Animations">
                  {animations.map(anim => (
                    <option key={anim.id} value={`animation:${anim.id}`}>
                      🎬 {anim.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="form-group">
              <label>Sound (optional)</label>
              <select
                value={selectedState.soundId || ''}
                onChange={(e) => updateState('soundId', e.target.value || null)}
              >
                <option value="">-- None --</option>
                {sounds.map(sound => (
                  <option key={sound.id} value={sound.id}>
                    🔊 {sound.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Empty state when no object selected */}
      {!selectedObject && objects.length > 0 && (
        <div className="state-empty-column">
          <p>Select an object to view its states</p>
        </div>
      )}
    </div>
  );
}
