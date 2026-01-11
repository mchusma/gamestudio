import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const StudioContext = createContext(null);

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
    deleteImage,
    uploadSound,
    uploadSoundFromUrl,
    deleteSound,
    createAnimation,
    updateAnimation,
    deleteAnimation,
    saveObjects,
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
