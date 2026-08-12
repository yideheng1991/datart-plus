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

import { dispatchResize } from 'app/utils/dispatchResize';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectEditBoard,
  selectWidgetConfigPanelOpen,
  selectWidgetConfigPanelWidgetId,
} from '../pages/BoardEditor/slice/selectors';
import { editDashBoardInfoActions } from '../pages/BoardEditor/slice';

const STORAGE_KEY = 'boardEditorPanelState';

export interface PanelState {
  leftCollapsed: boolean;
  leftExpandedSize: number;
  rightCollapsed: boolean;
  rightExpandedSize: number;
}

function loadPanelState(): Partial<PanelState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePanelState(state: PanelState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export interface SplitSizeConfig {
  size: number;
  minSize: number;
  maxSize: number;
  allowResize: boolean;
}

export function useBoardPanelState() {
  const dispatch = useDispatch();

  const board = useSelector(selectEditBoard);
  const widgetConfigPanelOpen = useSelector(selectWidgetConfigPanelOpen);
  const widgetConfigPanelWidgetId = useSelector(
    selectWidgetConfigPanelWidgetId,
  );

  const isChartConfigPanel =
    !!widgetConfigPanelOpen && !!widgetConfigPanelWidgetId;

  // ChartConfigPanel 打开/关闭会切换右侧面板宽度（minSize 500 → 200 等），
  // 需要通知画布重新计算缩放，否则画布会被新面板"挤压/遮挡"
  useEffect(() => {
    requestAnimationFrame(() => dispatchResize());
  }, [isChartConfigPanel]);

  const saved = useRef(loadPanelState());
  const [leftCollapsed, setLeftCollapsed] = useState(
    saved.current.leftCollapsed ?? false,
  );
  const [leftExpandedSize, setLeftExpandedSize] = useState(
    saved.current.leftExpandedSize ?? 256,
  );
  const [rightCollapsed, setRightCollapsed] = useState(
    saved.current.rightCollapsed ?? false,
  );
  const [rightExpandedSize, setRightExpandedSize] = useState(
    saved.current.rightExpandedSize ?? 300,
  );

  // 面板状态变化时自动持久化
  useEffect(() => {
    savePanelState({
      leftCollapsed,
      leftExpandedSize,
      rightCollapsed,
      rightExpandedSize,
    });
  }, [leftCollapsed, leftExpandedSize, rightCollapsed, rightExpandedSize]);

  const handleToggleLeft = useCallback(() => {
    setLeftCollapsed(prev => !prev);
    requestAnimationFrame(() => dispatchResize());
  }, []);

  const handleToggleRight = useCallback(() => {
    setRightCollapsed(prev => !prev);
    requestAnimationFrame(() => dispatchResize());
  }, []);

  const handleLeftDragFinished = useCallback(
    (newSize: string | number) => {
      setLeftExpandedSize(Number(newSize));
      dispatchResize();
    },
    [],
  );

  const handleRightDragFinished = useCallback(
    (newSize: string | number) => {
      setRightExpandedSize(Number(newSize));
      dispatchResize();
    },
    [],
  );

  const leftSplitSizes = useMemo<SplitSizeConfig>(() => {
    if (leftCollapsed) {
      return { size: 36, minSize: 36, maxSize: 36, allowResize: false };
    }
    return {
      size: leftExpandedSize,
      minSize: 200,
      maxSize: 400,
      allowResize: true,
    };
  }, [leftCollapsed, leftExpandedSize]);

  const rightSplitSizes = useMemo<SplitSizeConfig>(() => {
    if (rightCollapsed) {
      return { size: 36, minSize: 36, maxSize: 36, allowResize: false };
    }
    // 左侧面板收起时，画布空间更充裕，ChartConfigPanel 可以拉到 600
    // 左侧面板展开时，限制 maxSize 避免遮挡画布
    const chartMaxSize = leftCollapsed ? 600 : 500;
    return {
      size: isChartConfigPanel
        ? Math.max(rightExpandedSize, chartMaxSize)
        : rightExpandedSize,
      minSize: isChartConfigPanel ? 400 : 200,
      maxSize: isChartConfigPanel ? chartMaxSize : 400,
      allowResize: true,
    };
  }, [rightCollapsed, rightExpandedSize, isChartConfigPanel, leftCollapsed]);

  const onCloseChartConfigPanel = useCallback(() => {
    dispatch(editDashBoardInfoActions.closeWidgetConfigPanel());
    setRightCollapsed(false);
    setRightExpandedSize(300);
    requestAnimationFrame(() => dispatchResize());
  }, [dispatch]);

  return {
    board,
    widgetConfigPanelOpen,
    widgetConfigPanelWidgetId,
    isChartConfigPanel,
    leftCollapsed,
    rightCollapsed,
    leftSplitSizes,
    rightSplitSizes,
    handleToggleLeft,
    handleToggleRight,
    handleLeftDragFinished,
    handleRightDragFinished,
    onCloseChartConfigPanel,
  };
}
