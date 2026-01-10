import { useState } from 'react';
import { StudioProvider, useStudio } from './context/StudioContext';
import { ImageGallery } from './components/ImageGallery';
import { SoundGallery } from './components/SoundGallery';
import { AnimationPanel } from './components/AnimationPanel';
import { ObjectPanel } from './components/ObjectPanel';
import './App.css';

function GameSelector() {
  const { games, currentGame, selectGame, createGame } = useStudio();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    if (newName.trim()) {
      createGame(newName.trim());
      setNewName('');
      setShowNew(false);
    }
  };

  return (
    <div className="game-selector">
      <select
        value={currentGame || ''}
        onChange={(e) => selectGame(e.target.value)}
      >
        <option value="">-- Select Game --</option>
        {games.map((game) => (
          <option key={game} value={game}>
            {game}
          </option>
        ))}
      </select>
      {!showNew ? (
        <button onClick={() => setShowNew(true)}>+ New Game</button>
      ) : (
        <div className="new-game-form">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Game name..."
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <button onClick={handleCreate}>Create</button>
          <button onClick={() => setShowNew(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

function Sidebar({ activeCategory, onCategoryChange }) {
  const categories = [
    { id: 'images', label: 'Images', icon: '🖼️' },
    { id: 'sounds', label: 'Sounds', icon: '🔊' },
    { id: 'animations', label: 'Animations', icon: '🎬' },
    { id: 'objects', label: 'Objects', icon: '📦' }
  ];

  return (
    <nav className="sidebar">
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={`sidebar-item ${activeCategory === cat.id ? 'active' : ''}`}
          onClick={() => onCategoryChange(cat.id)}
        >
          <span className="icon">{cat.icon}</span>
          <span className="label">{cat.label}</span>
        </button>
      ))}
    </nav>
  );
}

function ContentPanel({ category }) {
  const { currentGame, gameData, loading } = useStudio();

  if (!currentGame) {
    return (
      <div className="content-panel empty">
        <p>Select or create a game to get started</p>
      </div>
    );
  }

  if (loading || !gameData) {
    return (
      <div className="content-panel empty">
        <p>Loading...</p>
      </div>
    );
  }

  switch (category) {
    case 'images':
      return <ImageGallery />;
    case 'sounds':
      return <SoundGallery />;
    case 'animations':
      return <AnimationPanel />;
    case 'objects':
      return <ObjectPanel />;
    default:
      return null;
  }
}

function StudioApp() {
  const [activeCategory, setActiveCategory] = useState('objects');

  return (
    <div className="studio">
      <header className="studio-header">
        <h1>Love2D Studio</h1>
        <GameSelector />
      </header>
      <div className="studio-body">
        <Sidebar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        <main className="studio-content">
          <ContentPanel category={activeCategory} />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <StudioProvider>
      <StudioApp />
    </StudioProvider>
  );
}

export default App;
