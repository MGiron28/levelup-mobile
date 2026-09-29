export type ThemeName = 'cozy' | 'dark' | 'ocean';

export const themes = {
  cozy: {
    primary: '#d97757',
    secondary: '#e8a999',
    background: '#fcf8f5',
    surface: '#ffffff',
    text: '#4a3f3a',
    textSecondary: '#8c7b73',
    border: '#f0e6e1',
    success: '#81b29a',
    error: '#e07a5f',
    warning: '#f2cc8f',
  },
  dark: {
    primary: '#bb86fc',
    secondary: '#03dac6',
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    border: '#2c2c2c',
    success: '#03dac6',
    error: '#cf6679',
    warning: '#f6d365',
  },
  ocean: {
    primary: '#0077b6',
    secondary: '#00b4d8',
    background: '#f0f8ff',
    surface: '#ffffff',
    text: '#03045e',
    textSecondary: '#0077b6',
    border: '#caf0f8',
    success: '#2a9d8f',
    error: '#e76f51',
    warning: '#e9c46a',
  }
};

// Mantenemos esto como fallback para no romper temporalmente las otras pantallas
export const colors = themes.cozy;

export const theme = {
  borderRadius: { small: 8, medium: 16, large: 24, round: 9999 },
  shadows: {
    soft: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    medium: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }
  }
};