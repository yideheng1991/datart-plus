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
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import { ToolbarButton } from 'app/components';
import useI18NPrefix from 'app/hooks/useI18NPrefix';
import { Widget } from 'app/pages/DashBoardPage/types/widgetTypes';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { editBoardStackActions } from '../../slice';
import { selectAllWidgetMap, selectSelectedIds } from '../../slice/selectors';

export type AlignmentType =
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'middle'
  | 'bottom'
  | 'hDistribute'
  | 'vDistribute';

export const AlignActions: React.FC = () => {
  const t = useI18NPrefix('viz.board.action');
  const dispatch = useDispatch();
  const selectedIdsStr = useSelector(selectSelectedIds);
  const allWidgetMap = useSelector(selectAllWidgetMap);

  const selectedIds = useMemo(
    () => (selectedIdsStr ? selectedIdsStr.split(',') : []),
    [selectedIdsStr],
  );

  const visible = selectedIds.length >= 2;

  const getSelectedWidgets = useCallback(() => {
    return selectedIds.map(id => allWidgetMap[id]).filter(Boolean) as Widget[];
  }, [allWidgetMap, selectedIds]);

  const handleAlign = useCallback(
    (type: AlignmentType) => {
      const widgets = getSelectedWidgets();
      if (widgets.length < 2) return;

      const rects = widgets.map(w => ({
        id: w.id,
        x: w.config.rect.x,
        y: w.config.rect.y,
        width: w.config.rect.width,
        height: w.config.rect.height,
      }));

      const minX = Math.min(...rects.map(r => r.x));
      const maxX = Math.max(...rects.map(r => r.x + r.width));
      const minY = Math.min(...rects.map(r => r.y));
      const maxY = Math.max(...rects.map(r => r.y + r.height));
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const updates = rects.map(r => {
        let newX = r.x;
        let newY = r.y;

        switch (type) {
          case 'left':
            newX = minX;
            break;
          case 'right':
            newX = maxX - r.width;
            break;
          case 'center':
            newX = centerX - r.width / 2;
            break;
          case 'top':
            newY = minY;
            break;
          case 'bottom':
            newY = maxY - r.height;
            break;
          case 'middle':
            newY = centerY - r.height / 2;
            break;
          case 'hDistribute': {
            const totalWidth = maxX - minX;
            const totalWidgetWidth = rects.reduce((sum, r) => sum + r.width, 0);
            const gap = (totalWidth - totalWidgetWidth) / (rects.length - 1);
            const sortedRects = [...rects].sort((a, b) => a.x - b.x);
            const idx = sortedRects.findIndex(sr => sr.id === r.id);
            let accX = minX;
            for (let i = 0; i < idx; i++) {
              accX += sortedRects[i].width + gap;
            }
            newX = accX;
            break;
          }
          case 'vDistribute': {
            const totalHeight = maxY - minY;
            const totalWidgetHeight = rects.reduce(
              (sum, r) => sum + r.height,
              0,
            );
            const gap = (totalHeight - totalWidgetHeight) / (rects.length - 1);
            const sortedRects = [...rects].sort((a, b) => a.y - b.y);
            const idx = sortedRects.findIndex(sr => sr.id === r.id);
            let accY = minY;
            for (let i = 0; i < idx; i++) {
              accY += sortedRects[i].height + gap;
            }
            newY = accY;
            break;
          }
        }

        return {
          id: r.id,
          rect: {
            x: Number(newX.toFixed(1)),
            y: Number(newY.toFixed(1)),
            width: r.width,
            height: r.height,
          },
          isAutoGroupWidget: false,
        };
      });

      dispatch(editBoardStackActions.batchUpdateWidgetsRect({ updates }));
    },
    [dispatch, getSelectedWidgets],
  );

  if (!visible) return null;

  return (
    <Wrapper>
      <Tooltip title={t('alignLeft')}>
        <ToolbarButton
          onClick={() => handleAlign('left')}
          icon={<AlignLeftOutlined />}
        />
      </Tooltip>
      <Tooltip title={t('alignCenter')}>
        <ToolbarButton
          onClick={() => handleAlign('center')}
          icon={<AlignCenterOutlined />}
        />
      </Tooltip>
      <Tooltip title={t('alignRight')}>
        <ToolbarButton
          onClick={() => handleAlign('right')}
          icon={<AlignRightOutlined />}
        />
      </Tooltip>
      <Tooltip title={t('alignTop')}>
        <ToolbarButton
          onClick={() => handleAlign('top')}
          icon={<AlignTopIcon />}
        />
      </Tooltip>
      <Tooltip title={t('alignMiddle')}>
        <ToolbarButton
          onClick={() => handleAlign('middle')}
          icon={<AlignMiddleIcon />}
        />
      </Tooltip>
      <Tooltip title={t('alignBottom')}>
        <ToolbarButton
          onClick={() => handleAlign('bottom')}
          icon={<AlignBottomIcon />}
        />
      </Tooltip>
      <Tooltip title={t('hDistribute')}>
        <ToolbarButton
          onClick={() => handleAlign('hDistribute')}
          icon={<HDistributeIcon />}
        />
      </Tooltip>
      <Tooltip title={t('vDistribute')}>
        <ToolbarButton
          onClick={() => handleAlign('vDistribute')}
          icon={<VDistributeIcon />}
        />
      </Tooltip>
    </Wrapper>
  );
};

const AlignTopIcon = () => (
  <svg
    viewBox="0 0 1024 1024"
    width="1em"
    height="1em"
    fill="currentColor"
    focusable="false"
  >
    <path d="M267.733333 938.666667a63.616 63.616 0 0 1-24.917333-5.034667 64 64 0 0 1-10.88-5.888 64 64 0 0 1-9.472-7.808 64.554667 64.554667 0 0 1-7.808-9.472 64 64 0 0 1-5.888-10.88 63.488 63.488 0 0 1-5.034667-24.917333V260.266667a63.488 63.488 0 0 1 5.034667-24.917334 64 64 0 0 1 5.888-10.88 64.597333 64.597333 0 0 1 7.808-9.472 64 64 0 0 1 9.472-7.808 64 64 0 0 1 10.88-5.888 63.616 63.616 0 0 1 24.917333-5.034666h128a63.573333 63.573333 0 0 1 24.917334 5.034666 64.341333 64.341333 0 0 1 10.88 5.888 64.64 64.64 0 0 1 9.472 7.808 64 64 0 0 1 7.808 9.472 64 64 0 0 1 5.888 10.88 63.658667 63.658667 0 0 1 5.034666 24.917334v614.4a63.658667 63.658667 0 0 1-5.034666 24.917333 64 64 0 0 1-5.888 10.88 64 64 0 0 1-7.808 9.472 64.597333 64.597333 0 0 1-9.472 7.808 64.341333 64.341333 0 0 1-10.88 5.888 63.573333 63.573333 0 0 1-24.917334 5.034667z m-4.266666-59.733334h136.533333V256h-136.533333z m361.6-170.666666a63.616 63.616 0 0 1-24.917334-5.034667 64 64 0 0 1-20.352-13.696 63.744 63.744 0 0 1-13.696-20.352 63.488 63.488 0 0 1-5.034666-24.917333v-384a63.488 63.488 0 0 1 5.034666-24.917334 63.744 63.744 0 0 1 13.696-20.352 64 64 0 0 1 20.352-13.696 63.616 63.616 0 0 1 24.917334-5.034666h128a63.573333 63.573333 0 0 1 24.917333 5.034666 63.701333 63.701333 0 0 1 20.352 13.696 64 64 0 0 1 13.738667 20.352 63.658667 63.658667 0 0 1 5.034666 24.917334v384a63.658667 63.658667 0 0 1-5.034666 24.917333 64 64 0 0 1-13.738667 20.352 63.701333 63.701333 0 0 1-20.352 13.696 63.573333 63.573333 0 0 1-24.917333 5.034667z m-4.266667-59.733334h136.533333V256h-136.533333zM85.333333 145.066667V85.333333h853.333334v59.733334z" />
  </svg>
);

const AlignMiddleIcon = () => (
  <svg
    viewBox="0 0 1024 1024"
    width="1em"
    height="1em"
    fill="currentColor"
    focusable="false"
  >
    <path d="M312.470588 281.088h-105.411764a26.352941 26.352941 0 0 0-26.352942 26.352941v421.647059c0 14.576941 11.806118 26.352941 26.352942 26.352941h105.411764a26.352941 26.352941 0 0 0 26.352941-26.352941v-421.647059a26.352941 26.352941 0 0 0-26.352941-26.352941z m-26.352941 52.705882v368.941177H233.411765v-368.941177H286.117647zM558.441412 210.823529h-105.411765a26.352941 26.352941 0 0 0-26.352941 26.352942v562.206117c0 14.546824 11.776 26.352941 26.352941 26.352941h105.411765a26.352941 26.352941 0 0 0 26.352941-26.352941V237.176471A26.352941 26.352941 0 0 0 558.441412 210.823529z m-26.383059 52.705883v509.470117h-52.705882V263.529412h52.705882zM804.382118 333.793882h-105.411765a26.352941 26.352941 0 0 0-26.352941 26.352942v316.235294c0 14.576941 11.806118 26.352941 26.352941 26.352941h105.411765a26.352941 26.352941 0 0 0 26.352941-26.352941v-316.235294a26.352941 26.352941 0 0 0-26.352941-26.352942z m-26.352942 52.705883v263.529411h-52.705882v-263.529411h52.705882z" />
  </svg>
);

const AlignBottomIcon = () => (
  <svg
    viewBox="0 0 1024 1024"
    width="1em"
    height="1em"
    fill="currentColor"
    focusable="false"
  >
    <path d="M85.333333 938.666667v-59.733334h853.333334V938.666667z m542.933334-110.933334a63.616 63.616 0 0 1-24.917334-5.034666 64 64 0 0 1-10.88-5.888 64 64 0 0 1-9.472-7.808 64.597333 64.597333 0 0 1-7.808-9.472 64 64 0 0 1-5.888-10.88 63.488 63.488 0 0 1-5.034666-24.917334V149.333333a63.488 63.488 0 0 1 5.034666-24.917333 64 64 0 0 1 5.888-10.88 64.597333 64.597333 0 0 1 7.808-9.472 64 64 0 0 1 9.472-7.808 64 64 0 0 1 10.88-5.888A63.616 63.616 0 0 1 628.266667 85.333333h128a63.573333 63.573333 0 0 1 24.917333 5.034667 64.256 64.256 0 0 1 10.88 5.888 64.512 64.512 0 0 1 9.472 7.808 64 64 0 0 1 7.808 9.472 64 64 0 0 1 5.888 10.88 63.658667 63.658667 0 0 1 5.034667 24.917333v614.4a63.658667 63.658667 0 0 1-5.034667 24.917334 64 64 0 0 1-5.888 10.88 64 64 0 0 1-7.808 9.472 64.64 64.64 0 0 1-9.472 7.808 64.341333 64.341333 0 0 1-10.88 5.888 63.573333 63.573333 0 0 1-24.917333 5.034666z m-4.266667-59.733333h136.533333V145.066667h-136.533333zM270.933333 827.733333a63.616 63.616 0 0 1-24.917333-5.034666 64 64 0 0 1-20.352-13.696 63.744 63.744 0 0 1-13.696-20.352 63.488 63.488 0 0 1-5.034667-24.917334v-384a63.488 63.488 0 0 1 5.034667-24.917333 63.744 63.744 0 0 1 13.696-20.352 64 64 0 0 1 20.352-13.696A63.616 63.616 0 0 1 270.933333 315.733333h128a63.573333 63.573333 0 0 1 24.917334 5.034667 63.701333 63.701333 0 0 1 20.352 13.696 64 64 0 0 1 13.738666 20.352 63.658667 63.658667 0 0 1 5.034667 24.917333v384a63.658667 63.658667 0 0 1-5.034667 24.917334 63.616 63.616 0 0 1-13.738666 20.352 63.701333 63.701333 0 0 1-20.352 13.696 63.573333 63.573333 0 0 1-24.917334 5.034666z m-4.266666-59.733333h136.533333V375.466667h-136.533333z" />
  </svg>
);

const HDistributeIcon = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" focusable="false">
    <rect x="0" y="7.25" width="16" height="1" fill="currentColor" />
    <rect
      x="1"
      y="2"
      width="3"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
    />
    <rect
      x="6.5"
      y="2"
      width="3"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
    />
    <rect
      x="12"
      y="2"
      width="3"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
    />
  </svg>
);

const VDistributeIcon = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" focusable="false">
    <rect x="7.25" y="0" width="1" height="16" fill="currentColor" />
    <rect
      x="2"
      y="1"
      width="12"
      height="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
    />
    <rect
      x="2"
      y="6.5"
      width="12"
      height="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
    />
    <rect
      x="2"
      y="12"
      width="12"
      height="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
    />
  </svg>
);

const Wrapper = styled.div`
  display: inline-flex;
  gap: 0;
  align-items: center;
`;
