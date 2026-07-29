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

import { useCallback, useContext, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useDispatch, useSelector } from 'react-redux';
import { BoardActionContext } from '../components/ActionProvider/BoardActionProvider';
import { WidgetActionContext } from '../components/ActionProvider/WidgetActionProvider';
import { useBoardCanvas } from '../pages/BoardEditor/FreeEditor/BoardCanvasContext';
import { editBoardStackActions } from '../pages/BoardEditor/slice';
import {
  selectAllWidgetMap,
  selectSelectedIds,
} from '../pages/BoardEditor/slice/selectors';

const MOVE_STEP = 1;
const MOVE_STEP_LARGE = 10;

export default function useBoardEditorHotkeys() {
  const { undo, redo } = useContext(BoardActionContext);
  const {
    onEditDeleteActiveWidgets,
    onEditLayerToTop,
    onEditLayerToBottom,
    onEditCopyWidgets,
    onEditPasteWidgets,
    onEditComposeGroup,
  } = useContext(WidgetActionContext);
  const dispatch = useDispatch();
  const selectedIdsStr = useSelector(selectSelectedIds);
  const allWidgetMap = useSelector(selectAllWidgetMap);
  const { scrollCanvas } = useBoardCanvas();

  // Use ref to avoid closure trap - always read latest value
  const selectedIdsRef = useRef<string>('');
  const allWidgetMapRef = useRef(allWidgetMap);
  const scrollCanvasRef = useRef(scrollCanvas);

  selectedIdsRef.current = selectedIdsStr;
  allWidgetMapRef.current = allWidgetMap;
  scrollCanvasRef.current = scrollCanvas;

  const moveSelectedWidgets = useCallback(
    (deltaX: number, deltaY: number) => {
      const idsStr = selectedIdsRef.current;
      if (!idsStr) return;
      const ids = idsStr.split(',');
      const updates = ids
        .map(id => {
          const w = allWidgetMapRef.current[id];
          if (!w) return null;
          return {
            id,
            rect: {
              ...w.config.rect,
              x: Number((w.config.rect.x + deltaX).toFixed(1)),
              y: Number((w.config.rect.y + deltaY).toFixed(1)),
            },
            isAutoGroupWidget: false,
          };
        })
        .filter(Boolean) as {
        id: string;
        rect: { x: number; y: number; width: number; height: number };
        isAutoGroupWidget: boolean;
      }[];

      if (updates.length > 0) {
        dispatch(editBoardStackActions.batchUpdateWidgetsRect({ updates }));
      }
    },
    [dispatch],
  );

  useHotkeys('delete,backspace', () => onEditDeleteActiveWidgets(), []);

  useHotkeys('ctrl+z,command+z', () => undo());
  useHotkeys('ctrl+shift+z,command+shift+z', () => redo());

  useHotkeys('ctrl+shift+up,command+shift+up', () => onEditLayerToTop());
  useHotkeys('ctrl+shift+down,command+shift+down', () => onEditLayerToBottom());

  useHotkeys('ctrl+c,command+c', () => onEditCopyWidgets());
  useHotkeys('ctrl+v,command+v', () => onEditPasteWidgets());

  useHotkeys('ctrl+g,command+g', e => {
    onEditComposeGroup();
    e.preventDefault();
  });

  const handleArrowUp = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      const hasExtraModifier = e.ctrlKey || e.metaKey;
      if (hasExtraModifier) return;
      const hasSelection = !!selectedIdsRef.current;
      if (hasSelection) {
        moveSelectedWidgets(0, -MOVE_STEP);
      } else {
        scrollCanvasRef.current(0, -40);
      }
    },
    [moveSelectedWidgets],
  );

  const handleShiftArrowUp = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      const hasExtraModifier = e.ctrlKey || e.metaKey;
      if (hasExtraModifier) return;
      const hasSelection = !!selectedIdsRef.current;
      if (hasSelection) {
        moveSelectedWidgets(0, -MOVE_STEP_LARGE);
      } else {
        scrollCanvasRef.current(0, -100);
      }
    },
    [moveSelectedWidgets],
  );

  const handleArrowDown = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      const hasExtraModifier = e.ctrlKey || e.metaKey;
      if (hasExtraModifier) return;
      const hasSelection = !!selectedIdsRef.current;
      if (hasSelection) {
        moveSelectedWidgets(0, MOVE_STEP);
      } else {
        scrollCanvasRef.current(0, 40);
      }
    },
    [moveSelectedWidgets],
  );

  const handleShiftArrowDown = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      const hasExtraModifier = e.ctrlKey || e.metaKey;
      if (hasExtraModifier) return;
      const hasSelection = !!selectedIdsRef.current;
      if (hasSelection) {
        moveSelectedWidgets(0, MOVE_STEP_LARGE);
      } else {
        scrollCanvasRef.current(0, 100);
      }
    },
    [moveSelectedWidgets],
  );

  const handleArrowLeft = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      const hasExtraModifier = e.ctrlKey || e.metaKey;
      if (hasExtraModifier) return;
      const hasSelection = !!selectedIdsRef.current;
      if (hasSelection) {
        moveSelectedWidgets(-MOVE_STEP, 0);
      } else {
        scrollCanvasRef.current(-40, 0);
      }
    },
    [moveSelectedWidgets],
  );

  const handleShiftArrowLeft = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      const hasExtraModifier = e.ctrlKey || e.metaKey;
      if (hasExtraModifier) return;
      const hasSelection = !!selectedIdsRef.current;
      if (hasSelection) {
        moveSelectedWidgets(-MOVE_STEP_LARGE, 0);
      } else {
        scrollCanvasRef.current(-100, 0);
      }
    },
    [moveSelectedWidgets],
  );

  const handleArrowRight = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      const hasExtraModifier = e.ctrlKey || e.metaKey;
      if (hasExtraModifier) return;
      const hasSelection = !!selectedIdsRef.current;
      if (hasSelection) {
        moveSelectedWidgets(MOVE_STEP, 0);
      } else {
        scrollCanvasRef.current(40, 0);
      }
    },
    [moveSelectedWidgets],
  );

  const handleShiftArrowRight = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      const hasExtraModifier = e.ctrlKey || e.metaKey;
      if (hasExtraModifier) return;
      const hasSelection = !!selectedIdsRef.current;
      if (hasSelection) {
        moveSelectedWidgets(MOVE_STEP_LARGE, 0);
      } else {
        scrollCanvasRef.current(100, 0);
      }
    },
    [moveSelectedWidgets],
  );

  useHotkeys('up', handleArrowUp);
  useHotkeys('shift+up', handleShiftArrowUp);
  useHotkeys('down', handleArrowDown);
  useHotkeys('shift+down', handleShiftArrowDown);
  useHotkeys('left', handleArrowLeft);
  useHotkeys('shift+left', handleShiftArrowLeft);
  useHotkeys('right', handleArrowRight);
  useHotkeys('shift+right', handleShiftArrowRight);
}
