import { useState } from 'react';
import { StudioProvider, useStudio } from './context/StudioContext';
import { ImageGallery } from './components/ImageGallery';
import { SoundGallery } from './components/SoundGallery';
import { ObjectPanel } from './components/ObjectPanel';
import { BackgroundPanel } from './components/BackgroundPanel';
import './App.css';

function Sidebar({ activeCategory, onCategoryChange }) {
  const { games, currentGame, selectGame } = useStudio();
  const categories = [
    { id: 'images', label: 'Images', icon: '🖼️' },
    { id: 'sounds', label: 'Sounds', icon: '🔊' },
    { id: 'objects', label: 'Objects', icon: '📦' },
    { id: 'backgrounds', label: 'Backgrounds', icon: '🗺️' }
  ];

  const handleNewGame = () => {
    alert('Create a new folder in games/ with a main.lua file');
  };

  return (
    <nav className="sidebar">
      <div className="game-selector">
        <select
          value={currentGame || ''}
          onChange={(e) => selectGame(e.target.value)}
        >
          <option value="">-- Select Project --</option>
          {games.map((game) => (
            <option key={game} value={game}>
              {game}
            </option>
          ))}
        </select>
        <button className="new-game-btn" onClick={handleNewGame}>+ New</button>
      </div>
      <div className="sidebar-categories">
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
      </div>
    </nav>
  );
}

function ContentPanel({ category }) {
  const { currentGame, gameData, loading } = useStudio();

  if (!currentGame) {
    return (
      <div className="content-panel empty">
        <p>Select a project to edit its assets</p>
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
    case 'objects':
      return <ObjectPanel />;
    case 'backgrounds':
      return <BackgroundPanel />;
    default:
      return null;
  }
}

function StudioApp() {
  const [activeCategory, setActiveCategory] = useState('objects');

  return (
    <div className="studio">
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
