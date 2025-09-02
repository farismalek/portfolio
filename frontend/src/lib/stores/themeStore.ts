import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { Theme, ThemeMode, ThemeSettings } from '$lib/types/themes';
import { applyThemeToDOM } from '$lib/utils/themeUtils';
import { DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME } from '$lib/themes/defaults';

export interface ThemeState {
  activeThemeId: string | null;
  themes: Record<string, Theme>;
  userThemes: string[];
  mode: ThemeMode;
  systemPreference: ThemeMode | null;
  isEditing: boolean;
  editingTheme: Theme | null;
}

function createThemeStore() {
  // Initialize with default state
  const initialState: ThemeState = {
    activeThemeId: null,
    themes: {
      'luminous': DEFAULT_LIGHT_THEME,
      'cosmic': DEFAULT_DARK_THEME
    },
    userThemes: [],
    mode: 'light',
    systemPreference: null,
    isEditing: false,
    editingTheme: null,
  };

  // Load themes from localStorage if in browser
  if (browser) {
    try {
      const savedThemes = localStorage.getItem('portfolia_themes');
      const activeTheme = localStorage.getItem('portfolia_activeTheme');
      const themeMode = localStorage.getItem('portfolia_themeMode');

      if (savedThemes) {
        const parsedThemes = JSON.parse(savedThemes);
        initialState.themes = { ...initialState.themes, ...parsedThemes };
      }

      if (activeTheme) {
        initialState.activeThemeId = activeTheme;
      } else {
        initialState.activeThemeId = 'luminous'; // Default to light theme
      }

      if (themeMode) {
        initialState.mode = themeMode as ThemeMode;
      }

      // Check system preference
      if (window.matchMedia) {
        const darkModePreference = window.matchMedia('(prefers-color-scheme: dark)');
        initialState.systemPreference = darkModePreference.matches ? 'dark' : 'light';

        // Set up listener for system preference change
        darkModePreference.addEventListener('change', (e) => {
          themeStore.updateSystemPreference(e.matches ? 'dark' : 'light');
        });
      }
    } catch (err) {
      console.error('Failed to load themes from localStorage:', err);
    }
  }

  const { subscribe, set, update } = writable<ThemeState>(initialState);

  // Derive the current active theme
  const activeTheme = derived({ subscribe }, ($state) => {
    if ($state.activeThemeId && $state.themes[$state.activeThemeId]) {
      return $state.themes[$state.activeThemeId];
    }

    // Fallback to default theme based on mode
    return $state.mode === 'dark' ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
  });

  return {
    subscribe,
    activeTheme,

    /**
     * Switch to a different theme by ID
     */
    setActiveTheme: (themeId: string) => {
      update(state => {
        if (!state.themes[themeId]) {
          console.error(`Theme ${themeId} not found`);
          return state;
        }

        const updatedState = { ...state, activeThemeId: themeId };

        if (browser) {
          localStorage.setItem('portfolia_activeTheme', themeId);
          applyThemeToDOM(state.themes[themeId]);
        }

        return updatedState;
      });
    },

    /**
     * Switch between light and dark mode
     */
    setThemeMode: (mode: ThemeMode) => {
      update(state => {
        // Find appropriate theme for the new mode
        let themeId = state.activeThemeId;
        if (state.themes[themeId]?.mode !== mode) {
          // Find a theme matching the new mode
          const modeThemes = Object.entries(state.themes)
            .filter(([_, theme]) => theme.mode === mode);

          if (modeThemes.length > 0) {
            themeId = modeThemes[0][0]; // Use the first theme matching the mode
          } else {
            // Fallback to default theme for this mode
            themeId = mode === 'dark' ? 'cosmic' : 'luminous';
          }
        }

        const updatedState = {
          ...state,
          mode,
          activeThemeId: themeId
        };

        if (browser) {
          localStorage.setItem('portfolia_themeMode', mode);
          localStorage.setItem('portfolia_activeTheme', themeId);
          applyThemeToDOM(state.themes[themeId]);
        }

        return updatedState;
      });
    },

    /**
     * Update the system theme preference
     */
    updateSystemPreference: (mode: ThemeMode) => {
      update(state => {
        return { ...state, systemPreference: mode };
      });
    },

    /**
     * Create a new theme
     */
    createTheme: (theme: Theme) => {
      update(state => {
        const themeId = theme.id || `theme-${Date.now()}`;
        const newTheme = { ...theme, id: themeId };

        const updatedState = {
          ...state,
          themes: {
            ...state.themes,
            [themeId]: newTheme
          },
          userThemes: [...state.userThemes, themeId]
        };

        if (browser) {
          const userThemes = { ...updatedState.themes };
          // Only store user themes in localStorage
          Object.keys(userThemes).forEach(id => {
            if (!updatedState.userThemes.includes(id)) {
              delete userThemes[id];
            }
          });
          localStorage.setItem('portfolia_themes', JSON.stringify(userThemes));
        }

        return updatedState;
      });
    },

    /**
     * Update an existing theme
     */
    updateTheme: (themeId: string, updates: Partial<ThemeSettings>) => {
      update(state => {
        if (!state.themes[themeId]) {
          console.error(`Theme ${themeId} not found`);
          return state;
        }

        const updatedTheme = {
          ...state.themes[themeId],
          settings: {
            ...state.themes[themeId].settings,
            ...updates
          },
          updatedAt: new Date().toISOString()
        };

        const updatedState = {
          ...state,
          themes: {
            ...state.themes,
            [themeId]: updatedTheme
          }
        };

        // If updating the active theme, apply changes
        if (browser && themeId === state.activeThemeId) {
          applyThemeToDOM(updatedTheme);
        }

        // Save user themes to localStorage
        if (browser && state.userThemes.includes(themeId)) {
          const userThemes = {};
          state.userThemes.forEach(id => {
            userThemes[id] = updatedState.themes[id];
          });
          localStorage.setItem('portfolia_themes', JSON.stringify(userThemes));
        }

        return updatedState;
      });
    },

    /**
     * Delete a theme
     */
    deleteTheme: (themeId: string) => {
      update(state => {
        // Can't delete built-in themes
        if (!state.userThemes.includes(themeId)) {
          console.error(`Cannot delete built-in theme: ${themeId}`);
          return state;
        }

        // Create new theme state without the deleted theme
        const updatedThemes = { ...state.themes };
        delete updatedThemes[themeId];

        // Update user themes list
        const updatedUserThemes = state.userThemes.filter(id => id !== themeId);

        // Switch to default theme if deleting active theme
        let updatedActiveThemeId = state.activeThemeId;
        if (updatedActiveThemeId === themeId) {
          updatedActiveThemeId = state.mode === 'dark' ? 'cosmic' : 'luminous';

          if (browser) {
            localStorage.setItem('portfolia_activeTheme', updatedActiveThemeId);
            applyThemeToDOM(updatedThemes[updatedActiveThemeId]);
          }
        }

        // Update localStorage
        if (browser) {
          const userThemes = {};
          updatedUserThemes.forEach(id => {
            userThemes[id] = updatedThemes[id];
          });
          localStorage.setItem('portfolia_themes', JSON.stringify(userThemes));
        }

        return {
          ...state,
          themes: updatedThemes,
          userThemes: updatedUserThemes,
          activeThemeId: updatedActiveThemeId
        };
      });
    },

    /**
     * Start editing a theme
     */
    startEditing: (themeId: string) => {
      update(state => {
        if (!state.themes[themeId]) {
          console.error(`Theme ${themeId} not found`);
          return state;
        }

        return {
          ...state,
          isEditing: true,
          editingTheme: { ...state.themes[themeId] }
        };
      });
    },

    /**
     * Update the editing theme (without saving)
     */
    updateEditingTheme: (updates: Partial<ThemeSettings>) => {
      update(state => {
        if (!state.isEditing || !state.editingTheme) {
          return state;
        }

        const updatedTheme = {
          ...state.editingTheme,
          settings: {
            ...state.editingTheme.settings,
            ...updates
          }
        };

        // Apply changes for preview
        if (browser) {
          applyThemeToDOM(updatedTheme);
        }

        return {
          ...state,
          editingTheme: updatedTheme
        };
      });
    },

    /**
     * Save the editing theme
     */
    saveEditingTheme: () => {
      update(state => {
        if (!state.isEditing || !state.editingTheme) {
          return state;
        }

        const themeId = state.editingTheme.id;
        const updatedTheme = {
          ...state.editingTheme,
          updatedAt: new Date().toISOString()
        };

        // If it's a built-in theme, create a copy instead of updating
        if (!state.userThemes.includes(themeId)) {
          const newThemeId = `${themeId}-custom-${Date.now()}`;
          const newTheme = {
            ...updatedTheme,
            id: newThemeId,
            name: `${updatedTheme.name} (Custom)`,
            isBuiltIn: false,
            createdAt: new Date().toISOString()
          };

          const updatedState = {
            ...state,
            isEditing: false,
            editingTheme: null,
            activeThemeId: newThemeId,
            themes: {
              ...state.themes,
              [newThemeId]: newTheme
            },
            userThemes: [...state.userThemes, newThemeId]
          };

          // Update localStorage
          if (browser) {
            localStorage.setItem('portfolia_activeTheme', newThemeId);

            const userThemes = {};
            updatedState.userThemes.forEach(id => {
              userThemes[id] = updatedState.themes[id];
            });
            localStorage.setItem('portfolia_themes', JSON.stringify(userThemes));
          }

          return updatedState;
        }

        // Otherwise update the existing theme
        const updatedState = {
          ...state,
          isEditing: false,
          editingTheme: null,
          themes: {
            ...state.themes,
            [themeId]: updatedTheme
          }
        };

        // Update localStorage
        if (browser && state.userThemes.includes(themeId)) {
          const userThemes = {};
          state.userThemes.forEach(id => {
            userThemes[id] = id === themeId ? updatedTheme : updatedState.themes[id];
          });
          localStorage.setItem('portfolia_themes', JSON.stringify(userThemes));
        }

        return updatedState;
      });
    },

    /**
     * Cancel theme editing
     */
    cancelEditing: () => {
      update(state => {
        // Reapply the active theme
        if (browser && state.activeThemeId) {
          applyThemeToDOM(state.themes[state.activeThemeId]);
        }

        return {
          ...state,
          isEditing: false,
          editingTheme: null
        };
      });
    },

    /**
     * Import a theme from JSON
     */
    importTheme: (themeJson: string) => {
      try {
        const theme = JSON.parse(themeJson) as Theme;

        // Validate theme structure
        if (!theme.name || !theme.settings || !theme.mode) {
          throw new Error('Invalid theme structure');
        }

        const themeId = `imported-${Date.now()}`;
        const importedTheme: Theme = {
          ...theme,
          id: themeId,
          isBuiltIn: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        update(state => {
          const updatedState = {
            ...state,
            themes: {
              ...state.themes,
              [themeId]: importedTheme
            },
            userThemes: [...state.userThemes, themeId]
          };

          // Update localStorage
          if (browser) {
            const userThemes = {};
            updatedState.userThemes.forEach(id => {
              userThemes[id] = updatedState.themes[id];
            });
            localStorage.setItem('portfolia_themes', JSON.stringify(userThemes));
          }

          return updatedState;
        });

        return { success: true, themeId };
      } catch (err) {
        console.error('Failed to import theme:', err);
        return { success: false, error: err.message };
      }
    },

    /**
     * Export a theme to JSON
     */
    exportTheme: (themeId: string) => {
      let exportData = null;

      update(state => {
        if (!state.themes[themeId]) {
          console.error(`Theme ${themeId} not found`);
          return state;
        }

        const theme = state.themes[themeId];

        // Create export version (omit certain fields)
        exportData = JSON.stringify({
          name: theme.name,
          description: theme.description,
          mode: theme.mode,
          settings: theme.settings,
          version: '1.0'
        }, null, 2);

        return state;
      });

      return exportData;
    }
  };
}

export const themeStore = createThemeStore();

// Export the active theme for easy access
export const activeTheme = themeStore.activeTheme;