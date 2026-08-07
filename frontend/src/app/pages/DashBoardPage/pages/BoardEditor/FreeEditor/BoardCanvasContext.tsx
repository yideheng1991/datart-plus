/**
 * Datart
 *
 * Copyright 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { createContext, useCallback, useContext, useRef } from 'react';

interface BoardCanvasContextValue {
  scrollContainerRef: React.RefObject<HTMLDivElement> | null;
  scrollCanvas: (deltaX: number, deltaY: number) => void;
  setScrollContainer: (el: HTMLDivElement | null) => void;
}

const defaultValue: BoardCanvasContextValue = {
  scrollContainerRef: null,
  scrollCanvas: () => {},
  setScrollContainer: () => {},
};

export const BoardCanvasContext =
  createContext<BoardCanvasContextValue>(defaultValue);

export const BoardCanvasProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const setScrollContainer = useCallback((el: HTMLDivElement | null) => {
    scrollContainerRef.current = el;
  }, []);

  const scrollCanvas = useCallback((deltaX: number, deltaY: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollLeft += deltaX;
    el.scrollTop += deltaY;
  }, []);

  return (
    <BoardCanvasContext.Provider
      value={{ scrollContainerRef, scrollCanvas, setScrollContainer }}
    >
      {children}
    </BoardCanvasContext.Provider>
  );
};

export const useBoardCanvas = () => useContext(BoardCanvasContext);
