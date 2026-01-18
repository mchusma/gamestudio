import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const StudioContext = createContext(null);

const STORAGE_KEY = 'love2d-studio-current-game';

const initialState = {
  games: [],
  currentGame: null,
  gameData: null,
  loading: true,
  error: null
};

function studioReducer(state, action) {
  switch (action.type) {
    case 'SET_GAMES':
      return { ...state, games: action.payload, loading: false };
    case 'SET_CURRENT_GAME':
      return { ...state, currentGame: action.payload, gameData: null };
    case 'SET_GAME_DATA':
      return { ...state, gameData: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'ADD_IMAGE':
      return {
        ...state,
        gameData: {
          ...state.gameData,
          images: [...state.gameData.images, action.payload]
        }
      };
    case 'UPDATE_IMAGE':
      return {
        ...state,
        gameData: {
          ...state.gameData,
          images: state.gameData.images.map(i =>
            i.id === action.payload.id ? action.payload : i
          )
        }
      };
    case 'DELETE_IMAGE':
      return {
        ...state,
        gameData: {
          ...state.gameData,
          images: state.gameData.images.filter(i => i.id !== action.payload)
        }
      };
    case 'ADD_SOUND':
      return {
        ...state,
        gameData: {
          ...state.gameData,
          sounds: [...state.gameData.sounds, action.payload]
        }
      };
    case 'UPDATE_SOUND':
      return {
        ...state,
        gameData: {
          ...state.gameData,
          sounds: state.gameData.sounds.map(s =>
            s.id === action.payload.id ? action.payload : s
          )
        }
      };
    case 'DELETE_SOUND':
      return {
        ...state,
        gameData: {
          ...state.gameData,
          sounds: state.gameData.sounds.filter(s => s.id !== action.payload)
        }
      };
    case 'ADD_ANIMATION':
      return {
        ...state,
        gameData: {
          ...state.gameData,
          animations: [...state.gameData.animations, action.payload]
        }
      };
    case 'UPDATE_ANIMATION':
      return {
        ...state,
        gameData: {
          ...state.gameData,
          animations: state.gameData.animations.map(a =>
            a.id === action.payload.id ? action.payload : a
          )
        }
      };
    case 'DELETE_ANIMATION':
      return {
        ...state,
        gameData: {
          ...state.gameData,
          animations: state.gameData.animations.filter(a => a.id !== action.payload)
        }
      };
    case 'SET_OBJECTS':
      return {
        ...state,
        gameData: {
          ...state.gameData,
          objects: action.payload
        }
      };
    case 'ADD_TILESET':
      return {
        ...state,
        gameData: {
          ...state.gameData,
          tilesets: [...(state.gameData.tilesets || []), action.payload]
        }
      };
    case 'DELETE_TILESET':
      return {
        ...state,
        gameData: {
          ...state.gameData,
          tilesets: (state.gameData.tilesets || []).filter(t => t.id !== action.payload)
        }
      };
    case 'ADD_BACKGROUND':
      return {
        ...state,
        gameData: {
          ...state.gameData,
          backgrounds: [...(state.gameData.backgrounds || []), action.payload]
        }
      };
    case 'UPDATE_BACKGROUND':
      return {
        ...state,
        gameData: {
          ...state.gameData,
          backgrounds: (state.gameData.backgrounds || []).map(b =>
            b.id === action.payload.id ? action.payload : b
          )
        }
      };
    case 'DELETE_BACKGROUND':
      return {
        ...state,
        gameData: {
          ...state.gameData,
          backgrounds: (state.gameData.backgrounds || []).filter(b => b.id !== action.payload)
        }
      };
    default:
      return state;
  }
}

export function StudioProvider({ children }) {
  const [state, dispatch] = useReducer(studioReducer, initialState);

  // Load games list on mount
  useEffect(() => {
    loadGames();
  }, []);

  // Load game data when current game changes
  useEffect(() => {
    if (state.currentGame) {
      loadGameData(state.currentGame);
    }
  }, [state.currentGame]);

  const loadGames = async () => {
    try {
      const games = await api.getGames();
      dispatch({ type: 'SET_GAMES', payload: games });

      // Restore previously selected game from localStorage
      const savedGame = localStorage.getItem(STORAGE_KEY);
      if (savedGame && games.includes(savedGame)) {
        dispatch({ type: 'SET_CURRENT_GAME', payload: savedGame });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const loadGameData = async (gameName) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await api.getGame(gameName);
      dispatch({ type: 'SET_GAME_DATA', payload: data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const selectGame = (name) => {
    dispatch({ type: 'SET_CURRENT_GAME', payload: name });
    // Save selection to localStorage
    if (name) {
      localStorage.setItem(STORAGE_KEY, name);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const uploadImage = async (file, name) => {
    try {
      const image = await api.uploadImage(state.currentGame, file, name);
      dispatch({ type: 'ADD_IMAGE', payload: image });
      return image;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const updateImage = async (id, updates) => {
    try {
      const image = await api.updateImage(state.currentGame, id, updates);
      dispatch({ type: 'UPDATE_IMAGE', payload: image });
      return image;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const deleteImage = async (id) => {
    try {
      await api.deleteImage(state.currentGame, id);
      dispatch({ type: 'DELETE_IMAGE', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const uploadImageFromUrl = async (url, name) => {
    try {
      const image = await api.uploadImageFromUrl(state.currentGame, url, name);
      dispatch({ type: 'ADD_IMAGE', payload: image });
      return image;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const uploadSound = async (file, name) => {
    try {
      const sound = await api.uploadSound(state.currentGame, file, name);
      dispatch({ type: 'ADD_SOUND', payload: sound });
      return sound;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const updateSound = async (id, updates) => {
    try {
      const sound = await api.updateSound(state.currentGame, id, updates);
      dispatch({ type: 'UPDATE_SOUND', payload: sound });
      return sound;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const deleteSound = async (id) => {
    try {
      await api.deleteSound(state.currentGame, id);
      dispatch({ type: 'DELETE_SOUND', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const uploadSoundFromUrl = async (url, name) => {
    try {
      const sound = await api.uploadSoundFromUrl(state.currentGame, url, name);
      dispatch({ type: 'ADD_SOUND', payload: sound });
      return sound;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const createAnimation = async ({ name, imageIds, frameDuration, loop }) => {
    try {
      const animation = await api.createAnimation(state.currentGame, {
        name,
        imageIds,
        frameDuration,
        loop
      });
      dispatch({ type: 'ADD_ANIMATION', payload: animation });
      return animation;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const updateAnimation = async (id, updates) => {
    try {
      const animation = await api.updateAnimation(state.currentGame, id, updates);
      dispatch({ type: 'UPDATE_ANIMATION', payload: animation });
      return animation;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const deleteAnimation = async (id) => {
    try {
      await api.deleteAnimation(state.currentGame, id);
      dispatch({ type: 'DELETE_ANIMATION', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const saveObjects = useCallback(async (objects) => {
    dispatch({ type: 'SET_OBJECTS', payload: objects });
    // Save to backend
    if (state.currentGame && state.gameData) {
      try {
        await api.saveGame(state.currentGame, {
          ...state.gameData,
          objects
        });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    }
  }, [state.currentGame, state.gameData]);

  // Tilesets
  const createTileset = async ({ name, imageId, tileWidth, tileHeight }) => {
    try {
      const tileset = await api.createTileset(state.currentGame, {
        name,
        imageId,
        tileWidth,
        tileHeight
      });
      dispatch({ type: 'ADD_TILESET', payload: tileset });
      return tileset;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const deleteTileset = async (id) => {
    try {
      await api.deleteTileset(state.currentGame, id);
      dispatch({ type: 'DELETE_TILESET', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Backgrounds
  const createBackground = async ({ name, width, height, tilesetId }) => {
    try {
      const background = await api.createBackground(state.currentGame, {
        name,
        width,
        height,
        tilesetId
      });
      dispatch({ type: 'ADD_BACKGROUND', payload: background });
      return background;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const updateBackground = async (id, data) => {
    try {
      const background = await api.updateBackground(state.currentGame, id, data);
      dispatch({ type: 'UPDATE_BACKGROUND', payload: background });
      return background;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const deleteBackground = async (id) => {
    try {
      await api.deleteBackground(state.currentGame, id);
      dispatch({ type: 'DELETE_BACKGROUND', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const getImageUrl = (filename) => {
    return api.getImageUrl(state.currentGame, filename);
  };

  const getSoundUrl = (filename) => {
    return api.getSoundUrl(state.currentGame, filename);
  };

  const getAnimationUrl = (filename) => {
    return api.getAnimationUrl(state.currentGame, filename);
  };

  const value = {
    ...state,
    selectGame,
    uploadImage,
    uploadImageFromUrl,
    updateImage,
    deleteImage,
    uploadSound,
    uploadSoundFromUrl,
    updateSound,
    deleteSound,
    createAnimation,
    updateAnimation,
    deleteAnimation,
    saveObjects,
    createTileset,
    deleteTileset,
    createBackground,
    updateBackground,
    deleteBackground,
    getImageUrl,
    getSoundUrl,
    getAnimationUrl
  };

  return (
    <StudioContext.Provider value={value}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
}
