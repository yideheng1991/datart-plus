import React, { useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import { ThemeProvider as OriginalThemeProvider } from 'styled-components';
import { useThemeSlice } from './slice';
import { selectTheme, selectThemeKey } from './slice/selectors';
import { themes } from './themes';

export const ThemeProvider = (props: { children: React.ReactChild }) => {
  useThemeSlice();

  const theme = useSelector(selectTheme);
  const themeKey = useSelector(selectThemeKey);

  useLayoutEffect(() => {
    // Set CSS custom properties on :root for Ant Design component overrides
    const root = document.documentElement;
    const resolvedKey = themeKey === 'system'
      ? (window?.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light')
      : themeKey;
    const currentTheme = themes[resolvedKey];
    if (currentTheme) {
      Object.entries(currentTheme).forEach(([key, value]) => {
        root.style.setProperty(`--datart-${key}`, value);
      });
    }
  }, [themeKey]);

  return (
    <OriginalThemeProvider theme={theme}>
      {React.Children.only(props.children)}
    </OriginalThemeProvider>
  );
};