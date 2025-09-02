export type ThemeMode = 'light' | 'dark';

export type ColorPaletteLevel = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export interface ColorPalette {
  [key: ColorPaletteLevel]: string;
}

export interface ColorSystem {
  primary: ColorPalette;
  secondary: ColorPalette;
  accent: ColorPalette;
  neutral: ColorPalette;
  success: ColorPalette;
  warning: ColorPalette;
  danger: ColorPalette;
  info: ColorPalette;
}

export interface Typography {
  fontFamily: {
    sans: string;
    serif: string;
    mono: string;
    display: string;
  };
  fontSizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    '8xl': string;
  };
  fontWeights: {
    thin: number;
    extralight: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
    black: number;
  };
  lineHeights: {
    none: number;
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  letterSpacing: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest: string;
  };
}

export interface BorderStyles {
  radius: {
    none: string;
    sm: string;
    DEFAULT: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };
  width: {
    DEFAULT: string;
    '0': string;
    '2': string;
    '4': string;
    '8': string;
  };
}

export interface ShadowStyles {
  sm: string;
  DEFAULT: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  none: string;
}

export interface SpacingSystem {
  '0': string;
  '0.5': string;
  '1': string;
  '1.5': string;
  '2': string;
  '2.5': string;
  '3': string;
  '3.5': string;
  '4': string;
  '5': string;
  '6': string;
  '7': string;
  '8': string;
  '9': string;
  '10': string;
  '11': string;
  '12': string;
  '14': string;
  '16': string;
  '20': string;
  '24': string;
  '28': string;
  '32': string;
  '36': string;
  '40': string;
  '44': string;
  '48': string;
  '52': string;
  '56': string;
  '60': string;
  '64': string;
  '72': string;
  '80': string;
  '96': string;
}

export interface AnimationSystem {
  duration: {
    fast: string;
    normal: string;
    slow: string;
    slower: string;
  };
  easing: {
    default: string;
    linear: string;
    in: string;
    out: string;
    inOut: string;
  };
}

export interface SemanticColors {
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
    inverse: string;
  };

  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
    inverse: string;
  };

  // Border colors
  border: {
    light: string;
    normal: string;
    strong: string;
    accent: string;
  };

  // UI Element colors
  ui: {
    focus: string;
    hover: string;
    pressed: string;
    selected: string;
  };

  // State colors
  state: {
    info: string;
    success: string;
    warning: string;
    danger: string;
  };
}

export interface ThemeSettings {
  colors: ColorSystem;
  semantic: SemanticColors;
  typography: Typography;
  spacing: SpacingSystem;
  borderStyles: BorderStyles;
  shadows: ShadowStyles;
  animations: AnimationSystem;
}

export interface Theme {
  id: string;
  name: string;
  description?: string;
  mode: ThemeMode;
  isBuiltIn?: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id?: string;
    name?: string;
  };
  settings: ThemeSettings;
}