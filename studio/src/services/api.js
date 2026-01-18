const API_BASE = '/api';

export const api = {
  // Games
  async getGames() {
    const res = await fetch(`${API_BASE}/games`);
    return res.json();
  },

  async createGame(name) {
    const res = await fetch(`${API_BASE}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return res.json();
  },

  async getGame(name) {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(name)}`);
    return res.json();
  },

  async saveGame(name, data) {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Images
  async uploadImage(game, file, name) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('name', name || file.name.replace(/\.[^/.]+$/, ''));

    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(game)}/images`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  async updateImage(game, id, { name }) {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(game)}/images/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return res.json();
  },

  async deleteImage(game, id) {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(game)}/images/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async uploadImageFromUrl(game, url, name) {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(game)}/images/from-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, name })
    });
    return res.json();
  },

  // Sounds
  async uploadSound(game, file, name) {
    const formData = new FormData();
    formData.append('sound', file);
    formData.append('name', name || file.name.replace(/\.[^/.]+$/, ''));

    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(game)}/sounds`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  async updateSound(game, id, { name }) {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(game)}/sounds/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return res.json();
  },

  async deleteSound(game, id) {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(game)}/sounds/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async uploadSoundFromUrl(game, url, name) {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(game)}/sounds/from-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, name })
    });
    return res.json();
  },

  // Animations
  async createAnimation(game, { name, imageIds, frameDuration, loop }) {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(game)}/animations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, imageIds, frameDuration, loop })
    });
    return res.json();
  },

  async updateAnimation(game, id, { name, imageIds, frameDuration, loop }) {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(game)}/animations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, imageIds, frameDuration, loop })
    });
    return res.json();
  },

  async deleteAnimation(game, id) {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(game)}/animations/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Asset URLs
  getImageUrl(game, filename) {
    return `/assets/${encodeURIComponent(game)}/images/${filename}`;
  },

  getSoundUrl(game, filename) {
    return `/assets/${encodeURIComponent(game)}/sounds/${filename}`;
  },

  getAnimationUrl(game, filename) {
    return `/assets/${encodeURIComponent(game)}/animations/${filename}`;
  },

  // Tilesets
  async createTileset(game, { name, imageId, tileWidth, tileHeight }) {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(game)}/tilesets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, imageId, tileWidth, tileHeight })
    });
    return res.json();
  },

  async deleteTileset(game, id) {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(game)}/tilesets/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Backgrounds
  async createBackground(game, { name, width, height, tilesetId }) {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(game)}/backgrounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, width, height, tilesetId })
    });
    return res.json();
  },

  async updateBackground(game, id, data) {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(game)}/backgrounds/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteBackground(game, id) {
    const res = await fetch(`${API_BASE}/games/${encodeURIComponent(game)}/backgrounds/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  }
};
