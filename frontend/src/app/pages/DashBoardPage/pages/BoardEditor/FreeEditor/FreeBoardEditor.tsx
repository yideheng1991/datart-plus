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

import { BoardConfigValContext } from 'app/pages/DashBoardPage/components/BoardProvider/BoardConfigProvider';
import { BoardContext } from 'app/pages/DashBoardPage/components/BoardProvider/BoardProvider';
import { WidgetWrapProvider } from 'app/pages/DashBoardPage/components/WidgetProvider/WidgetWrapProvider';
import { memo, useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components/macro';
import SlideBackground from '../../../components/FreeBoardBackground';
import useClientRect from '../../../hooks/useClientRect';
import useSlideStyle from '../../../hooks/useSlideStyle';
import ZoomControl from '../../Board/FreeDashboard/ZoomControl';
import BoardOverlay from '../components/BoardOverlay';
import { editWidgetInfoActions } from '../slice';
import {
  selectEditingWidgetIds,
  selectLayoutWidgetMap,
  selectSelectedIds,
} from '../slice/selectors';
import { BoardCanvasContext } from './BoardCanvasContext';
import { SmartGuides } from './SmartGuides';
import { WidgetOfFreeEdit } from './WidgetOfFreeEdit';

export const FreeBoardEditor: React.FC<{}> = memo(() => {
  const {
    width: boardWidth,
    height: boardHeight,
    scaleMode,
  } = useContext(BoardConfigValContext);
  const { autoFit, boardId } = useContext(BoardContext);
  const { setScrollContainer } = useContext(BoardCanvasContext);
  const dispatch = useDispatch();
  const editingWidgetIds = useSelector(selectEditingWidgetIds);
  const selectedIds = useSelector(selectSelectedIds);
  const layoutWidgetMap = useSelector(selectLayoutWidgetMap);
  const sortedLayoutWidgets = Object.values(layoutWidgetMap).sort(
    (a, b) => a.config.index - b.config.index,
  );

  const [rect, refGridBackground] = useClientRect<HTMLDivElement>();
  const {
    zoomIn,
    zoomOut,
    sliderChange,
    sliderValue,
    scale,
    nextBackgroundStyle,
    slideTranslate,
  } = useSlideStyle(autoFit, true, rect, boardWidth, boardHeight, scaleMode);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && selectedIds) {
        dispatch(editWidgetInfoActions.clearSelectedWidgets());
      }
    },
    [dispatch, selectedIds],
  );

  useEffect(() => {
    setScrollContainer(refGridBackground.current);
    return () => setScrollContainer(null);
  }, [setScrollContainer, refGridBackground]);

  return (
    <Container>
      <div
        className="grid-background"
        style={{ ...nextBackgroundStyle }}
        ref={refGridBackground}
        onMouseDown={handleCanvasMouseDown}
      >
        <SlideBackground scale={scale} slideTranslate={slideTranslate}>
          {sortedLayoutWidgets.map(widgetConfig => (
            <WidgetWrapProvider
              key={widgetConfig.id}
              id={widgetConfig.id}
              boardEditing={true}
              boardId={boardId}
            >
              <WidgetOfFreeEdit />
            </WidgetWrapProvider>
          ))}
          <SmartGuides />
          {!!editingWidgetIds && <BoardOverlay />}
        </SlideBackground>
      </div>

      <ZoomControl
        sliderValue={sliderValue}
        scale={scale}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        sliderChange={sliderChange}
      />
    </Container>
  );
});

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;

  .grid-background {
    flex: 1;
    -ms-overflow-style: none;
  }

  .grid-background::-webkit-scrollbar {
    width: 0 !important;
  }
`;
