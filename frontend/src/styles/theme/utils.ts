import { StorageKeys } from 'globalConstants';
import { ThemeKeyType } from './slice/types';
import { themes } from './themes';

/* istanbul ignore next line */
export const isSystemDark = window?.matchMedia
  ? window.matchMedia('(prefers-color-scheme: dark)')?.matches
  : undefined;

export function saveTheme(theme: ThemeKeyType) {
  window.localStorage && localStorage.setItem(StorageKeys.Theme, theme);
}

/* istanbul ignore next line */
export function getThemeFromStorage(): ThemeKeyType {
  let theme = 'light' as ThemeKeyType;
  try {
    const storedTheme =
      window.localStorage && localStorage.getItem(StorageKeys.Theme);
    if (storedTheme) {
      theme = storedTheme as ThemeKeyType;
    }
  } catch (error) {
    throw error;
  }
  return theme;
}

export function getTokenVariableMapping(themeKey: string) {
  const currentTheme = themes[themeKey];
  return {
    '@primary-color': currentTheme.primary,
    '@success-color': currentTheme.success,
    '@processing-color': currentTheme.processing,
    '@error-color': currentTheme.error,
    '@highlight-color': currentTheme.highlight,
    '@warning-color': currentTheme.warning,
    '@body-background': currentTheme.bodyBackground,
    '@text-color': currentTheme.textColor,
    '@text-color-secondary': currentTheme.textColorLight,
    '@heading-color': currentTheme.textColor,
    '@disabled-color': currentTheme.textColorDisabled,
  };
}

export function getVarsToBeModified(themeKey: string) {
  const tokenVariableMapping = getTokenVariableMapping(themeKey);
  const currentTheme = themes[themeKey];
  return {
    ...tokenVariableMapping,
    // Additional less variables if needed
    '@body-background': currentTheme.bodyBackground,
    '@component-background': currentTheme.componentBackground,
    '@heading-color': currentTheme.textColor,
    '@text-color-secondary': currentTheme.textColorLight,
    '@border-color-base': currentTheme.borderColorBase,
  };
}

/**
 * Theme change handler for Vite environment.
 * In Vite, Ant Design theme switching is handled via ConfigProvider's theme prop
 * instead of less.modifyVars (which requires browser-side less compilation).
 *
 * This function is kept for backward compatibility. The actual theme switching
 * is now handled by ConfigProvider in ThemeProvider component.
 */
export async function changeAntdTheme(themeKey: string) {
  // Theme switching in Vite is handled by ConfigProvider's theme prop
  // This function is a no-op in Vite environment
  // The actual theme tokens are passed via ConfigProvider in ThemeProvider component
}
