import React, { useState, useMemo } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from '@mui/material/styles';
import AppRoutes from "./routes/AppRoutes";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Create theme based on dark mode state
  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#6366f1', // Modern indigo
        light: '#818cf8',
        dark: '#4f46e5',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#ec4899', // Beautiful pink
        light: '#f472b6',
        dark: '#db2777',
        contrastText: '#ffffff',
      },
      success: {
        main: '#10b981', // Emerald green
        light: '#34d399',
        dark: '#059669',
      },
      warning: {
        main: '#f59e0b', // Amber
        light: '#fbbf24',
        dark: '#d97706',
      },
      error: {
        main: '#ef4444', // Red
        light: '#f87171',
        dark: '#dc2626',
      },
      background: {
        default: darkMode ? '#0f172a' : '#f8fafc',
        paper: darkMode ? '#1e293b' : '#ffffff',
        accent: darkMode ? '#334155' : '#f1f5f9',
      },
      text: {
        primary: darkMode ? '#f1f5f9' : '#1e293b',
        secondary: darkMode ? '#cbd5e1' : '#64748b',
        disabled: darkMode ? '#64748b' : '#94a3b8',
      },
      divider: darkMode ? '#334155' : '#e2e8f0',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: 'transparent',
            backdropFilter: 'blur(20px)',
            boxShadow: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(20px)',
            borderRadius: 16,
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            fontWeight: 600,
          },
        },
      },
    },
  }), [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRoutes darkMode={darkMode} onToggleDarkMode={handleToggleDarkMode} />
    </ThemeProvider>
  );
}

export default App;
