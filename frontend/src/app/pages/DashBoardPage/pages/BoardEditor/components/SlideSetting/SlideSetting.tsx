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
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import useI18NPrefix from 'app/hooks/useI18NPrefix';
import { WidgetWrapProvider } from 'app/pages/DashBoardPage/components/WidgetProvider/WidgetWrapProvider';
import { Widget } from 'app/pages/DashBoardPage/types/widgetTypes';
import { FC, memo, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { BoardContext } from '../../../../components/BoardProvider/BoardProvider';
import { selectAllWidgetMap, selectSelectedIds } from '../../slice/selectors';
import { BoardConfigPanel } from './BoardConfigPanel';
import { MultiStylePanel } from './MultiStylePanel';
import WidgetSetting from './WidgetSetting';

interface SlideSettingProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const SlideSetting: FC<SlideSettingProps> = memo(
  ({ collapsed, onToggleCollapse }) => {
    const t = useI18NPrefix(`viz.board.setting`);
    const { boardId } = useContext(BoardContext);
    const selectedIds = useSelector(selectSelectedIds);
    const allWidgetMap = useSelector(selectAllWidgetMap) as Record<
      string,
      Widget
    >;
    const { type, selectedIdArr, multiWidgets } = useMemo(() => {
      const selectedIdArr = selectedIds ? selectedIds.split(',') : [];
      const type =
        selectedIdArr.length === 0
          ? 'board'
          : selectedIdArr.length === 1
          ? 'widget'
          : 'multi';
      const multiWidgets =
        type === 'multi'
          ? selectedIdArr
              .map(id => allWidgetMap[id])
              .filter(Boolean)
          : [];
      return { type, selectedIdArr, multiWidgets };
    }, [selectedIds, allWidgetMap]);

    const renderContent = () => {
      if (type === 'widget') {
        return (
          <WidgetWrapProvider
            id={selectedIdArr[0]}
            boardEditing={true}
            boardId={boardId}
          >
            <WidgetSetting boardId={boardId} />
          </WidgetWrapProvider>
        );
      }
      if (type === 'multi') {
        return <MultiStylePanel selectedWidgets={multiWidgets} />;
      }
      return <BoardConfigPanel />;
    };

    if (collapsed) {
      return (
        <CollapsedBar onClick={onToggleCollapse}>
          <MenuFoldOutlined />
          <span>{t('setting')}</span>
        </CollapsedBar>
      );
    }

    return (
      <Wrapper onClick={e => e.stopPropagation()}>
        <CollapseBtn onClick={onToggleCollapse}>
          <MenuUnfoldOutlined />
        </CollapseBtn>
        {renderContent()}
      </Wrapper>
    );
  },
);

export default SlideSetting;

const Wrapper = styled.div<{}>`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background-color: ${p => p.theme.componentBackground};
  border-left: 1px solid ${p => p.theme.borderColorBase};
`;

const CollapseBtn = styled.div`
  position: absolute;
  top: 6px;
  right: 8px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 13px;
  color: ${p => p.theme.textColorSnd};
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    color: ${p => p.theme.primary};
    background-color: ${p => p.theme.bodyBackground};
  }
`;

const CollapsedBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 13px;
  color: ${p => p.theme.textColorSnd};
  letter-spacing: 4px;
  cursor: pointer;
  user-select: none;
  background-color: ${p => p.theme.componentBackground};
  border-left: 1px solid ${p => p.theme.borderColorBase};
  writing-mode: vertical-lr;

  &:hover {
    color: ${p => p.theme.primary};
    background-color: ${p => p.theme.bodyBackground};
  }
`;
