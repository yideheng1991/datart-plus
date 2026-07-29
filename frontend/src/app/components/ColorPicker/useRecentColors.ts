import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'datart_recent_colors';
const MAX_COLORS = 10;

function isValidColor(color: string): boolean {
  return (
    typeof color === 'string' &&
    (color.startsWith('#') ||
      color.startsWith('rgb') ||
      color.startsWith('rgba') ||
      color.startsWith('hsl'))
  );
}

function loadRecentColors(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(isValidColor).slice(0, MAX_COLORS);
      }
    }
  } catch (e) {}
  return [];
}

function saveRecentColors(colors: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch (e) {}
}

export function useRecentColors() {
  const [recentColors, setRecentColors] = useState<string[]>(() =>
    loadRecentColors(),
  );

  useEffect(() => {
    saveRecentColors(recentColors);
  }, [recentColors]);

  const addRecentColor = useCallback((color: string) => {
    if (!isValidColor(color)) return;
    setRecentColors(prev => {
      const filtered = prev.filter(
        c => c.toLowerCase() !== color.toLowerCase(),
      );
      return [color, ...filtered].slice(0, MAX_COLORS);
    });
  }, []);

  const clearRecentColors = useCallback(() => {
    setRecentColors([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { recentColors, addRecentColor, clearRecentColors };
}
