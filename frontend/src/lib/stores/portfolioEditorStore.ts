import { writable, derived, get } from 'svelte/store';
import type { Component, ComponentInstance, Portfolio, PortfolioPage, Template } from '$lib/types/portfolio';
import { v4 as uuid } from 'uuid';

// Types for editor actions
type EditorAction = {
  type: string;
  payload: any;
  timestamp: number;
};

// Main editor state
export interface EditorState {
  portfolio: Portfolio | null;
  currentPageId: string | null;
  selectedComponentId: string | null;
  draggedComponentId: string | null;
  isDragging: boolean;
  isEditing: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  previewZoom: number;
  history: {
    past: EditorAction[];
    future: EditorAction[];
  };
  undoable: boolean;
  redoable: boolean;
  error: string | null;
}

// Create initial state
const initialState: EditorState = {
  portfolio: null,
  currentPageId: null,
  selectedComponentId: null,
  draggedComponentId: null,
  isDragging: false,
  isEditing: false,
  isSaving: false,
  hasChanges: false,
  previewMode: 'desktop',
  previewZoom: 1,
  history: {
    past: [],
    future: [],
  },
  undoable: false,
  redoable: false,
  error: null,
};

// Create the store
function createEditorStore() {
  const { subscribe, set, update } = writable<EditorState>(initialState);

  // Helper for adding an action to history
  const addToHistory = (state: EditorState, actionType: string, payload: any): EditorState => {
    const action: EditorAction = {
      type: actionType,
      payload,
      timestamp: Date.now(),
    };

    return {
      ...state,
      history: {
        past: [...state.history.past, action],
        future: [], // Clear future when new action occurs
      },
      undoable: true,
      redoable: false,
      hasChanges: true,
    };
  };

  return {
    subscribe,

    // Initialize the editor with a portfolio
    initPortfolio: (portfolio: Portfolio) => {
      update(state => {
        // Set the initial portfolio and current page
        const firstPageId = portfolio.pages && portfolio.pages.length > 0 ?
          portfolio.pages[0].id : null;

        return {
          ...initialState,
          portfolio,
          currentPageId: firstPageId,
        };
      });
    },

    // Set current page
    setCurrentPage: (pageId: string) => {
      update(state => ({
        ...state,
        currentPageId: pageId,
        selectedComponentId: null,
      }));
    },

    // Select a component
    selectComponent: (componentId: string | null) => {
      update(state => ({
        ...state,
        selectedComponentId: componentId,
      }));
    },

    // Add a component to the current page
    addComponent: (component: Component, position: number) => {
      update(state => {
        if (!state.portfolio || !state.currentPageId) return state;

        // Find current page
        const currentPageIndex = state.portfolio.pages.findIndex(
          page => page.id === state.currentPageId
        );

        if (currentPageIndex === -1) return state;

        // Create a new component instance with default data
        const newInstance: ComponentInstance = {
          id: uuid(),
          componentId: component.id,
          type: component.type,
          data: component.defaultData || {},
          settings: {},
          position: position,
        };

        // Clone pages and add the component
        const updatedPages = [...state.portfolio.pages];
        const currentPage = { ...updatedPages[currentPageIndex] };

        // Initialize content array if it doesn't exist
        if (!currentPage.content) {
          currentPage.content = { components: [] };
        }

        if (!currentPage.content.components) {
          currentPage.content.components = [];
        }

        // Add component at specified position
        const components = [...currentPage.content.components];
        components.splice(position, 0, newInstance);

        // Update positions for all components
        components.forEach((comp, idx) => {
          comp.position = idx;
        });

        currentPage.content.components = components;
        updatedPages[currentPageIndex] = currentPage;

        // Create updated portfolio
        const updatedPortfolio = {
          ...state.portfolio,
          pages: updatedPages,
        };

        return addToHistory(
          {
            ...state,
            portfolio: updatedPortfolio,
            selectedComponentId: newInstance.id,
          },
          'ADD_COMPONENT',
          { componentId: newInstance.id, position }
        );
      });
    },

    // Update a component's data
    updateComponent: (componentId: string, data: any) => {
      update(state => {
        if (!state.portfolio || !state.currentPageId) return state;

        // Find current page
        const currentPageIndex = state.portfolio.pages.findIndex(
          page => page.id === state.currentPageId
        );

        if (currentPageIndex === -1) return state;

        // Clone pages and find the component
        const updatedPages = [...state.portfolio.pages];
        const currentPage = { ...updatedPages[currentPageIndex] };

        if (!currentPage.content?.components) return state;

        const componentIndex = currentPage.content.components.findIndex(
          comp => comp.id === componentId
        );

        if (componentIndex === -1) return state;

        // Update component data
        const updatedComponents = [...currentPage.content.components];
        updatedComponents[componentIndex] = {
          ...updatedComponents[componentIndex],
          data: {
            ...updatedComponents[componentIndex].data,
            ...data
          }
        };

        currentPage.content.components = updatedComponents;
        updatedPages[currentPageIndex] = currentPage;

        // Create updated portfolio
        const updatedPortfolio = {
          ...state.portfolio,
          pages: updatedPages,
        };

        return addToHistory(
          {
            ...state,
            portfolio: updatedPortfolio,
          },
          'UPDATE_COMPONENT',
          { componentId, data }
        );
      });
    },

    // Remove a component
    removeComponent: (componentId: string) => {
      update(state => {
        if (!state.portfolio || !state.currentPageId) return state;

        // Find current page
        const currentPageIndex = state.portfolio.pages.findIndex(
          page => page.id === state.currentPageId
        );

        if (currentPageIndex === -1) return state;

        // Clone pages
        const updatedPages = [...state.portfolio.pages];
        const currentPage = { ...updatedPages[currentPageIndex] };

        if (!currentPage.content?.components) return state;

        // Filter out the component
        const removedComponentIndex = currentPage.content.components.findIndex(
          comp => comp.id === componentId
        );

        if (removedComponentIndex === -1) return state;

        const removedComponent = currentPage.content.components[removedComponentIndex];
        const updatedComponents = currentPage.content.components.filter(
          comp => comp.id !== componentId
        );

        // Update positions
        updatedComponents.forEach((comp, idx) => {
          comp.position = idx;
        });

        currentPage.content.components = updatedComponents;
        updatedPages[currentPageIndex] = currentPage;

        // Create updated portfolio
        const updatedPortfolio = {
          ...state.portfolio,
          pages: updatedPages,
        };

        return addToHistory(
          {
            ...state,
            portfolio: updatedPortfolio,
            selectedComponentId: null,
          },
          'REMOVE_COMPONENT',
          {
            componentId,
            component: removedComponent,
            position: removedComponentIndex
          }
        );
      });
    },

    // Reorder components
    reorderComponents: (sourceIndex: number, destinationIndex: number) => {
      update(state => {
        if (!state.portfolio || !state.currentPageId) return state;

        // Find current page
        const currentPageIndex = state.portfolio.pages.findIndex(
          page => page.id === state.currentPageId
        );

        if (currentPageIndex === -1) return state;

        // Clone pages
        const updatedPages = [...state.portfolio.pages];
        const currentPage = { ...updatedPages[currentPageIndex] };

        if (!currentPage.content?.components) return state;

        // Reorder components
        const components = [...currentPage.content.components];
        const [movedComponent] = components.splice(sourceIndex, 1);
        components.splice(destinationIndex, 0, movedComponent);

        // Update positions
        components.forEach((comp, idx) => {
          comp.position = idx;
        });

        currentPage.content.components = components;
        updatedPages[currentPageIndex] = currentPage;

        // Create updated portfolio
        const updatedPortfolio = {
          ...state.portfolio,
          pages: updatedPages,
        };

        return addToHistory(
          {
            ...state,
            portfolio: updatedPortfolio,
          },
          'REORDER_COMPONENTS',
          { sourceIndex, destinationIndex }
        );
      });
    },

    // Update portfolio settings
    updatePortfolioSettings: (settings: any) => {
      update(state => {
        if (!state.portfolio) return state;

        const updatedPortfolio = {
          ...state.portfolio,
          settings: {
            ...state.portfolio.settings,
            ...settings
          }
        };

        return addToHistory(
          {
            ...state,
            portfolio: updatedPortfolio,
          },
          'UPDATE_PORTFOLIO_SETTINGS',
          { settings }
        );
      });
    },

    // Add a new page
    addPage: (page: PortfolioPage) => {
      update(state => {
        if (!state.portfolio) return state;

        const updatedPortfolio = {
          ...state.portfolio,
          pages: [...state.portfolio.pages, page],
        };

        return addToHistory(
          {
            ...state,
            portfolio: updatedPortfolio,
            currentPageId: page.id,
          },
          'ADD_PAGE',
          { pageId: page.id }
        );
      });
    },

    // Update page details
    updatePage: (pageId: string, updates: Partial<PortfolioPage>) => {
      update(state => {
        if (!state.portfolio) return state;

        const pageIndex = state.portfolio.pages.findIndex(p => p.id === pageId);
        if (pageIndex === -1) return state;

        const updatedPages = [...state.portfolio.pages];
        updatedPages[pageIndex] = {
          ...updatedPages[pageIndex],
          ...updates,
        };

        const updatedPortfolio = {
          ...state.portfolio,
          pages: updatedPages,
        };

        return addToHistory(
          {
            ...state,
            portfolio: updatedPortfolio,
          },
          'UPDATE_PAGE',
          { pageId, updates }
        );
      });
    },

    // Remove a page
    removePage: (pageId: string) => {
      update(state => {
        if (!state.portfolio) return state;

        // Don't allow removing the last page
        if (state.portfolio.pages.length <= 1) return state;

        const pageIndex = state.portfolio.pages.findIndex(p => p.id === pageId);
        if (pageIndex === -1) return state;

        const removedPage = state.portfolio.pages[pageIndex];
        const updatedPages = state.portfolio.pages.filter(p => p.id !== pageId);

        // If removing current page, switch to another one
        let newCurrentPageId = state.currentPageId;
        if (pageId === state.currentPageId) {
          newCurrentPageId = updatedPages[0]?.id || null;
        }

        const updatedPortfolio = {
          ...state.portfolio,
          pages: updatedPages,
        };

        return addToHistory(
          {
            ...state,
            portfolio: updatedPortfolio,
            currentPageId: newCurrentPageId,
          },
          'REMOVE_PAGE',
          { pageId, page: removedPage, pageIndex }
        );
      });
    },

    // Reorder pages
    reorderPages: (pageIds: string[]) => {
      update(state => {
        if (!state.portfolio) return state;

        // Ensure all page IDs exist
        const allIdsExist = pageIds.every(id =>
          state.portfolio!.pages.some(page => page.id === id)
        );

        if (!allIdsExist || pageIds.length !== state.portfolio.pages.length) {
          return state;
        }

        // Create new order of pages
        const updatedPages = pageIds.map(id =>
          state.portfolio!.pages.find(page => page.id === id)!
        );

        const updatedPortfolio = {
          ...state.portfolio,
          pages: updatedPages,
        };

        return addToHistory(
          {
            ...state,
            portfolio: updatedPortfolio,
          },
          'REORDER_PAGES',
          { pageIds }
        );
      });
    },

    // Set preview mode
    setPreviewMode: (mode: 'desktop' | 'tablet' | 'mobile') => {
      update(state => ({
        ...state,
        previewMode: mode,
      }));
    },

    // Set preview zoom
    setPreviewZoom: (zoom: number) => {
      update(state => ({
        ...state,
        previewZoom: Math.max(0.25, Math.min(2, zoom)),
      }));
    },

    // Start dragging component
    startDragging: (componentId: string) => {
      update(state => ({
        ...state,
        isDragging: true,
        draggedComponentId: componentId,
      }));
    },

    // End dragging component
    endDragging: () => {
      update(state => ({
        ...state,
        isDragging: false,
        draggedComponentId: null,
      }));
    },

    // Set saving state
    setSaving: (isSaving: boolean) => {
      update(state => ({
        ...state,
        isSaving,
      }));
    },

    // Mark changes as saved
    markAsSaved: () => {
      update(state => ({
        ...state,
        hasChanges: false,
      }));
    },

    // Set error message
    setError: (error: string | null) => {
      update(state => ({
        ...state,
        error,
      }));
    },

    // Undo last action
    undo: () => {
      update(state => {
        const { past, future } = state.history;
        if (past.length === 0) return state;

        const lastAction = past[past.length - 1];
        const newPast = past.slice(0, -1);

        // For now, we'll simply restore the entire portfolio from the previous state
        // A more sophisticated implementation would reverse individual actions

        return {
          ...state,
          history: {
            past: newPast,
            future: [lastAction, ...future],
          },
          undoable: newPast.length > 0,
          redoable: true,
        };
      });
    },

    // Redo last undone action
    redo: () => {
      update(state => {
        const { past, future } = state.history;
        if (future.length === 0) return state;

        const nextAction = future[0];
        const newFuture = future.slice(1);

        // For now, we'll simply restore the entire portfolio
        // A more sophisticated implementation would re-apply individual actions

        return {
          ...state,
          history: {
            past: [...past, nextAction],
            future: newFuture,
          },
          undoable: true,
          redoable: newFuture.length > 0,
        };
      });
    },

    // Reset store to initial state
    reset: () => {
      set(initialState);
    },
  };
}

// Create the store
export const portfolioEditorStore = createEditorStore();

// Derived stores
export const currentPage = derived(
  portfolioEditorStore,
  $store => {
    if (!$store.portfolio || !$store.currentPageId) return null;
    return $store.portfolio.pages.find(page => page.id === $store.currentPageId) || null;
  }
);

export const selectedComponent = derived(
  [portfolioEditorStore, currentPage],
  ([$store, $currentPage]) => {
    if (!$store.selectedComponentId || !$currentPage || !$currentPage.content?.components) {
      return null;
    }
    return $currentPage.content.components.find(comp => comp.id === $store.selectedComponentId) || null;
  }
);

export const componentsInCurrentPage = derived(
  currentPage,
  $currentPage => {
    if (!$currentPage || !$currentPage.content?.components) return [];
    return [...$currentPage.content.components].sort((a, b) => a.position - b.position);
  }
);

export const pages = derived(
  portfolioEditorStore,
  $store => {
    if (!$store.portfolio) return [];
    return $store.portfolio.pages;
  }
);

export const portfolioSettings = derived(
  portfolioEditorStore,
  $store => {
    if (!$store.portfolio) return null;
    return $store.portfolio.settings;
  }
);