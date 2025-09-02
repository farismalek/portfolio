import type { Theme } from '$lib/types/themes';
import { DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME } from './defaults';
import { createSemanticColors } from '$lib/utils/themeUtils';

// Emerald theme - Green based light theme
export const EMERALD_THEME: Theme = {
  id: 'emerald',
  name: 'Emerald',
  description: 'A fresh green-inspired theme',
  mode: 'light',
  isBuiltIn: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  settings: {
    ...DEFAULT_LIGHT_THEME.settings,
    colors: {
      ...DEFAULT_LIGHT_THEME.settings.colors,
      primary: {
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: '#10b981',
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
        950: '#022c22',
      },
      secondary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
        950: '#172554',
      }
    },
  }
};

// Apply semantic colors
EMERALD_THEME.settings.semantic = createSemanticColors(EMERALD_THEME.settings.colors, 'light');

// Midnight theme - Dark blue theme
export const MIDNIGHT_THEME: Theme = {
  id: 'midnight',
  name: 'Midnight',
  description: 'A dark blue theme with vibrant accents',
  mode: 'dark',
  isBuiltIn: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  settings: {
    ...DEFAULT_DARK_THEME.settings,
    colors: {
      ...DEFAULT_DARK_THEME.settings.colors,
      primary: {
        50: '#f1f9fe',
        100: '#e3f1fc',
        200: '#c3e4f9',
        300: '#90cff4',
        400: '#59b3ec',
        500: '#3295df',
        600: '#1e77c2',
        700: '#1a629d',
        800: '#1b5381',
        900: '#1c476b',
        950: '#121e2c',
      },
      neutral: {
        50: '#f6f8fb',
        100: '#edf0f7',
        200: '#dbe0ed',
        300: '#c0c9db',
        400: '#a2aac5',
        500: '#848bb0',
        600: '#6a719b',
        700: '#575e85',
        800: '#414762',
        900: '#191e2e',
        950: '#0f1117',
      }
    },
  }
};

// Apply semantic colors with custom overrides
MIDNIGHT_THEME.settings.semantic = {
  ...createSemanticColors(MIDNIGHT_THEME.settings.colors, 'dark'),
  background: {
    primary: '#0f1117',
    secondary: '#151824',
    tertiary: '#1e2234',
    accent: '#1a2341',
    inverse: '#ffffff',
  }
};

// Sunset theme - Orange/Red warm theme
export const SUNSET_THEME: Theme = {
  id: 'sunset',
  name: 'Sunset',
  description: 'A warm sunset-inspired theme',
  mode: 'light',
  isBuiltIn: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  settings: {
    ...DEFAULT_LIGHT_THEME.settings,
    colors: {
      ...DEFAULT_LIGHT_THEME.settings.colors,
      primary: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12',
        950: '#431407',
      },
      secondary: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
        950: '#450a0a',
      }
    },
  }
};

// Apply semantic colors with custom overrides
SUNSET_THEME.settings.semantic = {
  ...createSemanticColors(SUNSET_THEME.settings.colors, 'light'),
  background: {
    primary: '#ffffff',
    secondary: '#fff8f0',
    tertiary: '#fff1e1',
    accent: '#fef0e7',
    inverse: SUNSET_THEME.settings.colors.neutral[900],
  }
};

// Lavender theme - Purple pastel theme
export const LAVENDER_THEME: Theme = {
  id: 'lavender',
  name: 'Lavender',
  description: 'A soothing purple-inspired theme',
  mode: 'light',
  isBuiltIn: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  settings: {
    ...DEFAULT_LIGHT_THEME.settings,
    colors: {
      ...DEFAULT_LIGHT_THEME.settings.colors,
      primary: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7e22ce',
        800: '#6b21a8',
        900: '#581c87',
        950: '#3b0764',
      },
      secondary: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6',
        600: '#7c3aed',
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95',
        950: '#2e1065',
      }
    },
  }
};

// Apply semantic colors with custom overrides
LAVENDER_THEME.settings.semantic = {
  ...createSemanticColors(LAVENDER_THEME.settings.colors, 'light'),
  background: {
    primary: '#ffffff',
    secondary: '#faf8ff',
    tertiary: '#f5f1ff',
    accent: '#f0e8ff',
    inverse: LAVENDER_THEME.settings.colors.neutral[900],
  }
};

// Nightfall dark theme - Dark purple/blue theme
export const NIGHTFALL_THEME: Theme = {
  id: 'nightfall',
  name: 'Nightfall',
  description: 'A deep purple night-inspired theme',
  mode: 'dark',
  isBuiltIn: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  settings: {
    ...DEFAULT_DARK_THEME.settings,
    colors: {
      ...DEFAULT_DARK_THEME.settings.colors,
      primary: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7e22ce',
        800: '#6b21a8',
        900: '#581c87',
        950: '#3b0764',
      },
      neutral: {
        50: '#f8f7fc',
        100: '#f1effa',
        200: '#e5e1f4',
        300: '#d2cbe8',
        400: '#b3aad5',
        500: '#968ac1',
        600: '#786fad',
        700: '#635b95',
        800: '#534c7a',
        900: '#2d273f',
        950: '#1c1724',
      }
    },
  }
};

// Apply semantic colors with custom overrides
NIGHTFALL_THEME.settings.semantic = {
  ...createSemanticColors(NIGHTFALL_THEME.settings.colors, 'dark'),
  background: {
    primary: '#121016',
    secondary: '#1a171f',
    tertiary: '#211e27',
    accent: '#2a2033',
    inverse: '#ffffff',
  }
};

// All built-in themes
export const BUILT_IN_THEMES = [
  DEFAULT_LIGHT_THEME,
  DEFAULT_DARK_THEME,
  EMERALD_THEME,
  MIDNIGHT_THEME,
  SUNSET_THEME,
  LAVENDER_THEME,
  NIGHTFALL_THEME
];