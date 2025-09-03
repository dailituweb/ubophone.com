import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const themes = {
  light: {
    background: '#FAFAFA',
    cardBackground: 'white',
    primaryText: '#0a0f2f',
    secondaryText: '#64748b',
    borderColor: '#000',
    hoverColor: '#f8fafc',
    accent: '#FFC900',
    sidebarBg: 'white',
    headerBg: 'white',
    inputBg: 'white',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    mutedBg: '#f8fafc',
    successColor: '#10b981',
    errorColor: '#ef4444',
    warningColor: '#f59e0b'
  },
  dark: {
    background: '#0f172a',
    cardBackground: '#1e293b',
    primaryText: '#f1f5f9',
    secondaryText: '#94a3b8',
    borderColor: '#334155',
    hoverColor: '#334155',
    accent: '#FFC900',
    sidebarBg: '#1e293b',
    headerBg: '#1e293b',
    inputBg: '#334155',
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    mutedBg: '#334155',
    successColor: '#10b981',
    errorColor: '#ef4444',
    warningColor: '#f59e0b'
  }
};

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme');
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    } else {
      // Auto-detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setCurrentTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('admin-theme', currentTheme);
    
    // Update CSS custom properties for global theme access
    const theme = themes[currentTheme];
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--theme-${key}`, value);
    });
  }, [currentTheme]);

  const toggleTheme = () => {
    setCurrentTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const value = {
    theme: themes[currentTheme],
    currentTheme,
    toggleTheme,
    setTheme,
    isDark: currentTheme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeContext;