import React, { useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import { ThemeProvider as OriginalThemeProvider } from 'styled-components';
import { useThemeSlice } from './slice';
import { selectTheme, selectThemeKey } from './slice/selectors';
import { changeAntdTheme } from './utils';

export const ThemeProvider = (props: { children: React.ReactChild }) => {
  useThemeSlice();

  const theme = useSelector(selectTheme);
  const themeKey = useSelector(selectThemeKey);

  useLayoutEffect(() => {
    // TODO: Ant Design theme switching via less.modifyVars is not available in Vite.
    // This is a known limitation. For proper theme switching, consider:
    // 1. Upgrading to Ant Design 5.x which supports ConfigProvider theme prop
    // 2. Using CSS variables approach
    changeAntdTheme(themeKey);
  }, [themeKey]);

  return (
    <OriginalThemeProvider theme={theme}>
      {React.Children.only(props.children)}
    </OriginalThemeProvider>
  );
};
