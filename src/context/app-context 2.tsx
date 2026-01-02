import { createContextId } from '@builder.io/qwik';

export interface AppState {
  isDark: boolean;
  isMenuOpen: boolean;
  isSearchOpen: boolean;
  expandedMenus: Record<string, boolean>;
  sectionTitle?: string;
  sectionIcon?: string;
}

export const AppContext = createContextId<AppState>('app.context');
