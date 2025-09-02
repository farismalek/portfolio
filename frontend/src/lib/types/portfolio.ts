// Portfolio types
export interface Portfolio {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'password_protected';
  password?: string;
  slug: string;
  customDomain?: string;
  thumbnailUrl?: string;
  templateId: string;
  customizations?: Record<string, any>;
  settings?: {
    typography?: Record<string, any>;
    colors?: Record<string, any>;
    layout?: Record<string, any>;
    meta?: Record<string, any>;
  };
  analytics?: Record<string, any>;
  featured: boolean;
  userId: string;
  pages: PortfolioPage[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  lastViewedAt?: string;
  viewCount: number;
}

export interface PortfolioPage {
  id: string;
  title: string;
  slug?: string;
  order: number;
  content?: {
    components?: ComponentInstance[];
    [key: string]: any;
  };
  metadata?: Record<string, any>;
  isHomePage: boolean;
  portfolioId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentInstance {
  id: string;
  componentId: string;
  type: string;
  data: Record<string, any>;
  settings?: Record<string, any>;
  position: number;
}

export interface Component {
  id: string;
  name: string;
  category: ComponentCategory;
  type: string;
  schema: Record<string, any>;
  defaultData?: Record<string, any>;
  thumbnailUrl: string;
  isPremium: boolean;
}

export type ComponentCategory =
  | 'header'
  | 'hero'
  | 'about'
  | 'projects'
  | 'skills'
  | 'experience'
  | 'education'
  | 'testimonials'
  | 'contact'
  | 'gallery'
  | 'footer'
  | 'custom';

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  thumbnailUrl: string;
  structure: Record<string, any>;
  defaultPages: Record<string, any>[];
  typography?: Record<string, any>;
  colors?: Record<string, any>;
  isPremium: boolean;
  featured: boolean;
}

export type TemplateCategory =
  | 'creative'
  | 'professional'
  | 'minimal'
  | 'tech'
  | 'design'
  | 'photography'
  | 'business'
  | 'custom';

// Template color theme definition
export interface ColorTheme {
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  accent?: {
    [key: string]: string;
  };
}

// Typography theme definition
export interface TypographyTheme {
  fontFamily: {
    heading: string;
    body: string;
    mono?: string;
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
}