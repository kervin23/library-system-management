import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Theme colors - Dark Olive Green
export const themes = {
  light: {
    name: 'light',
    primary: '#556B2F',
    primaryDark: '#3d4f22',
    primaryLight: '#6b8e23',
    secondary: '#8b7355',
    accent: '#a0522d',
    background: '#f8f6f3',
    surface: '#ffffff',
    surfaceHover: '#f0ede8',
    surfaceAlt: '#e8e4dc',
    text: '#2c2c2c',
    textSecondary: '#5a5a5a',
    textMuted: '#888888',
    border: '#d4cfc4',
    borderLight: '#e8e4dc',
    shadow: 'rgba(0, 0, 0, 0.08)',
    shadowMedium: 'rgba(0, 0, 0, 0.12)',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#c62828',
    info: '#0277bd',
  },
  dark: {
    name: 'dark',
    primary: '#8fbc8f',
    primaryDark: '#6b8e23',
    primaryLight: '#98d982',
    secondary: '#d4a574',
    accent: '#cd853f',
    background: '#1a1a1a',
    surface: '#252525',
    surfaceHover: '#333333',
    surfaceAlt: '#2d2d2d',
    text: '#e8e8e8',
    textSecondary: '#b0b0b0',
    textMuted: '#707070',
    border: '#404040',
    borderLight: '#4a4a4a',
    shadow: 'rgba(0, 0, 0, 0.4)',
    shadowMedium: 'rgba(0, 0, 0, 0.5)',
    success: '#4caf50',
    warning: '#ffa726',
    error: '#ef5350',
    info: '#29b6f6',
  }
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  const theme = isDark ? themes.dark : themes.light;

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    // Apply to body
    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.text;
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  }, [isDark, theme]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
