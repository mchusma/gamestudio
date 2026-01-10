import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Project paths - games are stored in actual game folders, not a separate data directory
const PROJECT_ROOT = path.join(__dirname, '..');
const GAMES_DIR = path.join(PROJECT_ROOT, 'games');
const DASHBOARD_DIR = path.join(PROJECT_ROOT, 'dashboard');

// Helper to resolve game paths
function getGamePath(gameId) {
  if (gameId === 'dashboard') return DASHBOARD_DIR;
  return path.join(GAMES_DIR, gameId);
}

app.use(cors());
app.use(express.json());

// Serve static assets from game folders
app.get('/assets/:game/:type/:filename', (req, res) => {
  const gameDir = getGamePath(req.params.game);
  const assetPath = path.join(req.params.type, req.params.filename);
  res.sendFile(path.join(gameDir, assetPath));
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ensure directory exists
async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// ============ GAMES ============

// List all games - discovers games by scanning for main.lua files
app.get('/api/games', async (req, res) => {
  try {
    const discoveredGames = [];

    // Scan games/ folder for directories with main.lua
    const gamesEntries = await fs.readdir(GAMES_DIR, { withFileTypes: true });
    for (const entry of gamesEntries) {
      if (entry.isDirectory()) {
        const mainLuaPath = path.join(GAMES_DIR, entry.name, 'main.lua');
        try {
          await fs.access(mainLuaPath);
          discoveredGames.push(entry.name);
        } catch {
          // No main.lua, skip this folder
        }
      }
    }

    // Include dashboard as editable project
    discoveredGames.push('dashboard');

    // Sort alphabetically
    discoveredGames.sort();

    res.json(discoveredGames);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new game - games must be created manually with main.lua
app.post('/api/games', async (req, res) => {
  res.status(400).json({
    error: 'Games must be created manually in the games/ folder with a main.lua file'
  });
});

// Get game data - extends simple game.json with studio fields
app.get('/api/games/:game', async (req, res) => {
  try {
    const gameDir = getGamePath(req.params.game);
    const gameFile = path.join(gameDir, 'game.json');

    let gameData;
    try {
      const data = await fs.readFile(gameFile, 'utf-8');
      gameData = JSON.parse(data);
    } catch {
      // No game.json exists - create default from folder name
      gameData = {
        name: req.params.game,
        description: ''
      };
    }

    // Ensure studio-required fields exist (don't overwrite if present)
    const extendedData = {
      name: gameData.name || req.params.game,
      description: gameData.description || '',
      images: gameData.images || [],
      sounds: gameData.sounds || [],
      animations: gameData.animations || [],
      objects: gameData.objects || []
    };

    res.json(extendedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save game data
app.put('/api/games/:game', async (req, res) => {
  try {
    const gameDir = getGamePath(req.params.game);
    const gameFile = path.join(gameDir, 'game.json');

    await fs.writeFile(gameFile, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ IMAGES ============

// Upload image
app.post('/api/games/:game/images', upload.single('image'), async (req, res) => {
  try {
    const gameDir = getGamePath(req.params.game);
    const imagesDir = path.join(gameDir, 'images');
    await ensureDir(imagesDir);

    const id = uuidv4();
    const originalName = req.file.originalname;
    const ext = path.extname(originalName);
    const filename = `${id}${ext}`;
    const filepath = path.join(imagesDir, filename);

    // Get image dimensions
    const metadata = await sharp(req.file.buffer).metadata();

    // Save file
    await fs.writeFile(filepath, req.file.buffer);

    const imageData = {
      id,
      name: req.body.name || path.basename(originalName, ext),
      filename,
      width: metadata.width,
      height: metadata.height,
      createdAt: new Date().toISOString()
    };

    // Update game.json
    const gameFile = path.join(gameDir, 'game.json');
    const gameData = JSON.parse(await fs.readFile(gameFile, 'utf-8'));
    gameData.images.push(imageData);
    await fs.writeFile(gameFile, JSON.stringify(gameData, null, 2));

    res.json(imageData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete image
app.delete('/api/games/:game/images/:id', async (req, res) => {
  try {
    const gameDir = getGamePath(req.params.game);
    const gameFile = path.join(gameDir, 'game.json');
    const gameData = JSON.parse(await fs.readFile(gameFile, 'utf-8'));

    const image = gameData.images.find(i => i.id === req.params.id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete file
    const filepath = path.join(gameDir, 'images', image.filename);
    await fs.unlink(filepath).catch(() => {});

    // Update game.json
    gameData.images = gameData.images.filter(i => i.id !== req.params.id);
    await fs.writeFile(gameFile, JSON.stringify(gameData, null, 2));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SOUNDS ============

// Upload sound
app.post('/api/games/:game/sounds', upload.single('sound'), async (req, res) => {
  try {
    const gameDir = getGamePath(req.params.game);
    const soundsDir = path.join(gameDir, 'sounds');
    await ensureDir(soundsDir);

    const id = uuidv4();
    const originalName = req.file.originalname;
    const ext = path.extname(originalName);
    const filename = `${id}${ext}`;
    const filepath = path.join(soundsDir, filename);

    // Save file
    await fs.writeFile(filepath, req.file.buffer);

    const soundData = {
      id,
      name: req.body.name || path.basename(originalName, ext),
      filename,
      format: ext.replace('.', ''),
      createdAt: new Date().toISOString()
    };

    // Update game.json
    const gameFile = path.join(gameDir, 'game.json');
    const gameData = JSON.parse(await fs.readFile(gameFile, 'utf-8'));
    gameData.sounds.push(soundData);
    await fs.writeFile(gameFile, JSON.stringify(gameData, null, 2));

    res.json(soundData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete sound
app.delete('/api/games/:game/sounds/:id', async (req, res) => {
  try {
    const gameDir = getGamePath(req.params.game);
    const gameFile = path.join(gameDir, 'game.json');
    const gameData = JSON.parse(await fs.readFile(gameFile, 'utf-8'));

    const sound = gameData.sounds.find(s => s.id === req.params.id);
    if (!sound) {
      return res.status(404).json({ error: 'Sound not found' });
    }

    // Delete file
    const filepath = path.join(gameDir, 'sounds', sound.filename);
    await fs.unlink(filepath).catch(() => {});

    // Update game.json
    gameData.sounds = gameData.sounds.filter(s => s.id !== req.params.id);
    await fs.writeFile(gameFile, JSON.stringify(gameData, null, 2));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ANIMATIONS ============

// Create animation (generates sprite sheet from images)
app.post('/api/games/:game/animations', async (req, res) => {
  try {
    const { name, imageIds, frameDuration, loop } = req.body;
    const gameDir = getGamePath(req.params.game);
    const gameFile = path.join(gameDir, 'game.json');
    const gameData = JSON.parse(await fs.readFile(gameFile, 'utf-8'));

    // Get the images
    const images = imageIds.map(id => gameData.images.find(i => i.id === id)).filter(Boolean);
    if (images.length === 0) {
      return res.status(400).json({ error: 'No valid images provided' });
    }

    // Load all image buffers
    const imageBuffers = await Promise.all(
      images.map(async (img) => {
        const filepath = path.join(gameDir, 'images', img.filename);
        return sharp(filepath);
      })
    );

    // Get dimensions of first image (assume all same size)
    const firstMeta = await imageBuffers[0].metadata();
    const frameWidth = firstMeta.width;
    const frameHeight = firstMeta.height;

    // Create horizontal sprite sheet
    const spriteWidth = frameWidth * images.length;
    const spriteHeight = frameHeight;

    // Composite all frames horizontally
    const composites = await Promise.all(
      imageBuffers.map(async (img, i) => ({
        input: await img.toBuffer(),
        left: i * frameWidth,
        top: 0
      }))
    );

    const id = uuidv4();
    const filename = `${id}.png`;
    const animationsDir = path.join(gameDir, 'animations');
    await ensureDir(animationsDir);

    await sharp({
      create: {
        width: spriteWidth,
        height: spriteHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite(composites)
      .png()
      .toFile(path.join(animationsDir, filename));

    const animationData = {
      id,
      name,
      filename,
      frameWidth,
      frameHeight,
      frameCount: images.length,
      frameDuration: frameDuration || 0.1,
      loop: loop !== false,
      sourceImages: imageIds,
      createdAt: new Date().toISOString()
    };

    // Update game.json
    gameData.animations.push(animationData);
    await fs.writeFile(gameFile, JSON.stringify(gameData, null, 2));

    res.json(animationData);
  } catch (error) {
    console.error('Animation creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update animation
app.put('/api/games/:game/animations/:id', async (req, res) => {
  try {
    const { name, imageIds, frameDuration, loop } = req.body;
    const gameDir = getGamePath(req.params.game);
    const gameFile = path.join(gameDir, 'game.json');
    const gameData = JSON.parse(await fs.readFile(gameFile, 'utf-8'));

    const animIndex = gameData.animations.findIndex(a => a.id === req.params.id);
    if (animIndex === -1) {
      return res.status(404).json({ error: 'Animation not found' });
    }

    const oldAnim = gameData.animations[animIndex];

    // If images changed, regenerate sprite sheet
    if (imageIds && JSON.stringify(imageIds) !== JSON.stringify(oldAnim.sourceImages)) {
      const images = imageIds.map(id => gameData.images.find(i => i.id === id)).filter(Boolean);
      if (images.length === 0) {
        return res.status(400).json({ error: 'No valid images provided' });
      }

      const imageBuffers = await Promise.all(
        images.map(async (img) => {
          const filepath = path.join(gameDir, 'images', img.filename);
          return sharp(filepath);
        })
      );

      const firstMeta = await imageBuffers[0].metadata();
      const frameWidth = firstMeta.width;
      const frameHeight = firstMeta.height;
      const spriteWidth = frameWidth * images.length;
      const spriteHeight = frameHeight;

      const composites = await Promise.all(
        imageBuffers.map(async (img, i) => ({
          input: await img.toBuffer(),
          left: i * frameWidth,
          top: 0
        }))
      );

      const animationsDir = path.join(gameDir, 'animations');
      await sharp({
        create: {
          width: spriteWidth,
          height: spriteHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite(composites)
        .png()
        .toFile(path.join(animationsDir, oldAnim.filename));

      oldAnim.frameWidth = frameWidth;
      oldAnim.frameHeight = frameHeight;
      oldAnim.frameCount = images.length;
      oldAnim.sourceImages = imageIds;
    }

    // Update other properties
    if (name !== undefined) oldAnim.name = name;
    if (frameDuration !== undefined) oldAnim.frameDuration = frameDuration;
    if (loop !== undefined) oldAnim.loop = loop;
    oldAnim.updatedAt = new Date().toISOString();

    gameData.animations[animIndex] = oldAnim;
    await fs.writeFile(gameFile, JSON.stringify(gameData, null, 2));

    res.json(oldAnim);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete animation
app.delete('/api/games/:game/animations/:id', async (req, res) => {
  try {
    const gameDir = getGamePath(req.params.game);
    const gameFile = path.join(gameDir, 'game.json');
    const gameData = JSON.parse(await fs.readFile(gameFile, 'utf-8'));

    const animation = gameData.animations.find(a => a.id === req.params.id);
    if (!animation) {
      return res.status(404).json({ error: 'Animation not found' });
    }

    // Delete file
    const filepath = path.join(gameDir, 'animations', animation.filename);
    await fs.unlink(filepath).catch(() => {});

    // Update game.json
    gameData.animations = gameData.animations.filter(a => a.id !== req.params.id);
    await fs.writeFile(gameFile, JSON.stringify(gameData, null, 2));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ OBJECTS ============

// Objects are stored directly in game.json, so we just update the whole game data
// The frontend will handle object manipulation and send the full objects array

app.listen(PORT, () => {
  console.log(`Studio API server running on http://localhost:${PORT}`);
});
