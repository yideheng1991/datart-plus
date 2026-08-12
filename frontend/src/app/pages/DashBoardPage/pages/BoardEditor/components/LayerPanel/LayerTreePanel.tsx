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
import { ListTitle } from 'app/components/ListTitle';
import useI18NPrefix from 'app/hooks/useI18NPrefix';
import { FC, memo, useMemo } from 'react';
import styled from 'styled-components';
import { LayerTree } from './LayerTree';

interface LayerTreePanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const LayerTreePanel: FC<LayerTreePanelProps> = memo(
  ({ collapsed, onToggleCollapse }) => {
    const t = useI18NPrefix(`viz.board.action`);

    const titleProps = useMemo(
      () => ({
        title: t('widgetList'),
      }),
      [t],
    );

    if (collapsed) {
      return (
        <CollapsedBar onClick={onToggleCollapse}>
          <MenuUnfoldOutlined />
          <span>{t('widgetList')}</span>
        </CollapsedBar>
      );
    }

    return (
      <Panel>
        <ListTitle {...titleProps} />
        <CollapseBtn onClick={onToggleCollapse}>
          <MenuFoldOutlined />
        </CollapseBtn>
        <LayerTree />
      </Panel>
    );
  },
);
const Panel = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${p => p.theme.componentBackground};
  box-shadow: ${p => p.theme.shadowSider};
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
  border-right: 1px solid ${p => p.theme.borderColorBase};
  writing-mode: vertical-rl;

  &:hover {
    color: ${p => p.theme.primary};
    background-color: ${p => p.theme.bodyBackground};
  }
`;
