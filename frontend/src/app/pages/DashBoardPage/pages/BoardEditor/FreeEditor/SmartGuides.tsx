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
import { Widget } from 'app/pages/DashBoardPage/types/widgetTypes';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components/macro';
import { widgetMove, widgetMoveEnd } from '../slice/events';
import { selectAllWidgetMap } from '../slice/selectors';

const SNAP_THRESHOLD = 5;

interface GuideLine {
  orientation: 'vertical' | 'horizontal';
  position: number;
  type: 'edge' | 'center' | 'distribute';
}

export const SmartGuides: React.FC = () => {
  const allWidgetMap = useSelector(selectAllWidgetMap);

  const allLayoutWidgetsRef = useRef<Widget[]>([]);
  const draggingIdsRef = useRef<string[]>([]);
  const totalDeltaRef = useRef<[number, number]>([0, 0]);
  const [guides, setGuides] = useState<GuideLine[]>([]);

  useEffect(() => {
    allLayoutWidgetsRef.current = Object.values(allWidgetMap).filter(
      w => !w.parentId,
    );
  }, [allWidgetMap]);

  const calculateGuides = useCallback((deltaX: number, deltaY: number) => {
    const allWidgets = allLayoutWidgetsRef.current;
    const draggingIds = draggingIdsRef.current;
    if (draggingIds.length === 0) return;

    const draggingWidgets = draggingIds
      .map(id => allWidgets.find(w => w.id === id))
      .filter(Boolean) as Widget[];
    if (draggingWidgets.length === 0) return;

    const otherWidgets = allWidgets.filter(w => !draggingIds.includes(w.id));
    if (otherWidgets.length === 0) return;

    const movedDraggingWidgets = draggingWidgets.map(w => ({
      id: w.id,
      left: w.config.rect.x + deltaX,
      right: w.config.rect.x + w.config.rect.width + deltaX,
      centerX: w.config.rect.x + w.config.rect.width / 2 + deltaX,
      top: w.config.rect.y + deltaY,
      bottom: w.config.rect.y + w.config.rect.height + deltaY,
      centerY: w.config.rect.y + w.config.rect.height / 2 + deltaY,
      width: w.config.rect.width,
      height: w.config.rect.height,
    }));

    const otherRects = otherWidgets.map(w => ({
      id: w.id,
      left: w.config.rect.x,
      right: w.config.rect.x + w.config.rect.width,
      centerX: w.config.rect.x + w.config.rect.width / 2,
      top: w.config.rect.y,
      bottom: w.config.rect.y + w.config.rect.height,
      centerY: w.config.rect.y + w.config.rect.height / 2,
    }));

    const newGuides: GuideLine[] = [];

    const minX = Math.min(...movedDraggingWidgets.map(w => w.left));
    const maxX = Math.max(...movedDraggingWidgets.map(w => w.right));
    const centerX = (minX + maxX) / 2;
    const minY = Math.min(...movedDraggingWidgets.map(w => w.top));
    const maxY = Math.max(...movedDraggingWidgets.map(w => w.bottom));
    const centerY = (minY + maxY) / 2;

    otherRects.forEach(other => {
      if (Math.abs(minX - other.left) < SNAP_THRESHOLD) {
        newGuides.push({
          orientation: 'vertical',
          position: other.left,
          type: 'edge',
        });
      }
      if (Math.abs(maxX - other.right) < SNAP_THRESHOLD) {
        newGuides.push({
          orientation: 'vertical',
          position: other.right,
          type: 'edge',
        });
      }
      if (Math.abs(centerX - other.centerX) < SNAP_THRESHOLD) {
        newGuides.push({
          orientation: 'vertical',
          position: other.centerX,
          type: 'center',
        });
      }
      if (Math.abs(minY - other.top) < SNAP_THRESHOLD) {
        newGuides.push({
          orientation: 'horizontal',
          position: other.top,
          type: 'edge',
        });
      }
      if (Math.abs(maxY - other.bottom) < SNAP_THRESHOLD) {
        newGuides.push({
          orientation: 'horizontal',
          position: other.bottom,
          type: 'edge',
        });
      }
      if (Math.abs(centerY - other.centerY) < SNAP_THRESHOLD) {
        newGuides.push({
          orientation: 'horizontal',
          position: other.centerY,
          type: 'center',
        });
      }
    });

    const verticalSet = new Set<string>();
    const horizontalSet = new Set<string>();
    const uniqueGuides = newGuides.filter(g => {
      const key = `${g.orientation}-${Math.round(g.position)}`;
      if (g.orientation === 'vertical') {
        if (verticalSet.has(key)) return false;
        verticalSet.add(key);
        return true;
      } else {
        if (horizontalSet.has(key)) return false;
        horizontalSet.add(key);
        return true;
      }
    });

    setGuides(uniqueGuides);
  }, []);

  useEffect(() => {
    const handleMove = (
      selectedIdStr: string,
      deltaX: number,
      deltaY: number,
    ) => {
      if (!draggingIdsRef.current.length) {
        draggingIdsRef.current = selectedIdStr.split(',').filter(Boolean);
        totalDeltaRef.current = [0, 0];
      }
      totalDeltaRef.current[0] += deltaX;
      totalDeltaRef.current[1] += deltaY;
      calculateGuides(totalDeltaRef.current[0], totalDeltaRef.current[1]);
    };

    const handleMoveEnd = () => {
      draggingIdsRef.current = [];
      totalDeltaRef.current = [0, 0];
      setGuides([]);
    };

    widgetMove.on(handleMove);
    widgetMoveEnd.on(handleMoveEnd);

    return () => {
      widgetMove.off(handleMove);
      widgetMoveEnd.off(handleMoveEnd);
    };
  }, [calculateGuides]);

  return (
    <GuidesContainer>
      {guides.map((guide, idx) => (
        <Guide
          key={idx}
          orientation={guide.orientation}
          position={guide.position}
        />
      ))}
    </GuidesContainer>
  );
};

const GuidesContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 9998;
  overflow: visible;
  pointer-events: none;
`;

const Guide = styled.div<{
  orientation: 'vertical' | 'horizontal';
  position: number;
}>`
  position: absolute;
  background-color: #1890ff;
  opacity: 0.8;

  ${p =>
    p.orientation === 'vertical'
      ? `
    left: ${p.position}px;
    top: -100px;
    width: 1px;
    height: 2000px;
  `
      : `
    top: ${p.position}px;
    left: -100px;
    height: 1px;
    width: 3000px;
  `}
`;
