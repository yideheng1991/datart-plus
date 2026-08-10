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

import { Empty, Switch, Tabs } from 'antd';
import useI18NPrefix from 'app/hooks/useI18NPrefix';
import ChartManager from 'app/models/ChartManager';
import ChartI18NContext from 'app/pages/ChartWorkbenchPage/contexts/Chart18NContext';
import { IChart } from 'app/types/Chart';
import { ChartConfig } from 'app/types/ChartConfig';
import { transferChartDataConfig } from 'app/utils/internalChartHelper';
import {
  FC,
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import styled from 'styled-components';
import {
  BORDER_RADIUS,
  FONT_SIZE_BODY,
  FONT_WEIGHT_MEDIUM,
  FONT_WEIGHT_REGULAR,
  SPACE_MD,
  SPACE_SM,
  SPACE_XS,
} from 'styles/StyleConstants';
import { CloneValueDeep } from 'utils/object';
import ChartGraphIcon from './ChartGraphIcon';

const ALL_TAB_KEY = '__all__';
const RECENT_TAB_KEY = '__recent__';

type PanelLayout = 'horizontal' | 'vertical';

const { TabPane } = Tabs;

const ChartGraphPanel: FC<{
  chart?: IChart;
  chartConfig?: ChartConfig;
  layoutDirection: PanelLayout;
  showLayoutSwitch?: boolean;
  onLayoutDirectionChange: (layout: PanelLayout) => void;
  onChartChange: (chart: IChart) => void;
}> = memo(
  ({
    chart,
    chartConfig,
    layoutDirection,
    showLayoutSwitch = true,
    onLayoutDirectionChange,
    onChartChange,
  }) => {
    const t = useI18NPrefix('viz.palette.graph');
    const chartManager = ChartManager.instance();
    const [allCharts] = useState<IChart[]>(chartManager.getAllCharts());
    const [activeTabKey, setActiveTabKey] = useState<string>(ALL_TAB_KEY);
    const [recentCharts, setRecentCharts] = useState<IChart[]>(
      chartManager.getRecentCharts(),
    );
    const [requirementsStates, setRequirementStates] = useState<object>({});

    const isVertical = layoutDirection === 'vertical';

    const handleLayoutChange = useCallback(
      (checked: boolean) => {
        onLayoutDirectionChange(checked ? 'vertical' : 'horizontal');
      },
      [onLayoutDirectionChange],
    );

    const categorizedCharts = useMemo(() => {
      return chartManager.getCategorizedCharts();
    }, [chartManager]);

    const categoryMeta = useMemo(() => {
      return ChartManager.getCategoryMeta();
    }, []);

    useLayoutEffect(() => {
      if (allCharts) {
        const dict = allCharts?.reduce((acc, cur) => {
          const transferedChartConfig = transferChartDataConfig(
            { datas: CloneValueDeep(cur?.config?.datas || []) },
            { datas: chartConfig?.datas },
          );
          acc[cur.meta.id] = cur?.isMatchRequirement(transferedChartConfig);
          return acc;
        }, {});
        setRequirementStates(dict);
      }
    }, [allCharts, chartConfig]);

    const handleChartChange = useCallback(
      (selectedChart: IChart) => {
        chartManager.recordRecentChart(selectedChart?.meta?.id);
        setRecentCharts(chartManager.getRecentCharts());
        onChartChange(selectedChart);
      },
      [chartManager, onChartChange],
    );

    const renderChartIcons = useCallback(
      (charts: IChart[]) => {
        return charts?.map(c => {
          return (
            <ChartI18NContext.Provider
              key={c?.meta?.id}
              value={{ i18NConfigs: c?.config?.i18ns }}
            >
              <ChartGraphIcon
                chart={c}
                isActive={c?.meta?.id === chart?.meta?.id}
                isMatchRequirement={!!requirementsStates?.[c?.meta?.id]}
                onChartChange={handleChartChange}
              />
            </ChartI18NContext.Provider>
          );
        });
      },
      [chart?.meta?.id, handleChartChange, requirementsStates],
    );

    return (
      <StyledPanel $vertical={isVertical}>
        {showLayoutSwitch && (
          <LayoutToolbar $vertical={isVertical}>
            <LayoutLabel>{t('category.layoutHorizontal')}</LayoutLabel>
            <Switch
              size="small"
              checked={isVertical}
              checkedChildren={t('category.layoutVertical')}
              unCheckedChildren={t('category.layoutHorizontal')}
              onChange={handleLayoutChange}
            />
          </LayoutToolbar>
        )}

        <StyledTabs
          $vertical={isVertical}
          activeKey={activeTabKey}
          tabPosition={isVertical ? 'left' : 'top'}
          onChange={setActiveTabKey}
        >
        <TabPane tab={t('category.all')} key={ALL_TAB_KEY}>
          <StyledChartGraphPanel>{renderChartIcons(allCharts)}</StyledChartGraphPanel>
        </TabPane>

        <TabPane
          tab={t('category.recent')}
          key={RECENT_TAB_KEY}
          disabled={!recentCharts?.length}
        >
          <StyledChartGraphPanel>
            {recentCharts?.length ? (
              renderChartIcons(recentCharts)
            ) : (
              <StyledEmpty description={t('category.noRecent')} />
            )}
          </StyledChartGraphPanel>
        </TabPane>

        {categoryMeta.map(categoryKey => {
          const charts = categorizedCharts?.[categoryKey] || [];
          if (!charts?.length) {
            return null;
          }
          return (
            <TabPane tab={t(`category.${categoryKey}`)} key={categoryKey}>
              <StyledChartGraphPanel>
                {renderChartIcons(charts)}
              </StyledChartGraphPanel>
            </TabPane>
          );
        })}
        </StyledTabs>
      </StyledPanel>
    );
  },
);

export default ChartGraphPanel;

const StyledTabs = styled(Tabs)<{ $vertical: boolean }>`
  margin-bottom: ${SPACE_MD};

  &.ant-tabs.ant-tabs-top > .ant-tabs-nav {
    padding: ${SPACE_XS} ${SPACE_XS} 0;
    margin: 0;
    background-color: ${p => p.theme.componentBackground};
    border-radius: ${BORDER_RADIUS};
  }

  &.ant-tabs.ant-tabs-top > .ant-tabs-content-holder {
    padding: ${SPACE_XS};
    margin-top: ${SPACE_XS};
    color: ${p => p.theme.textColorLight};
    background-color: ${p => p.theme.componentBackground};
    border-radius: ${BORDER_RADIUS};
  }

  &.ant-tabs.ant-tabs-left {
    flex: 1;
    min-height: 0;

    > .ant-tabs-nav {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: ${SPACE_XS};
      margin: 0;
      overflow-y: auto;
      background-color: ${p => p.theme.componentBackground};
      border-radius: ${BORDER_RADIUS};

      .ant-tabs-nav-wrap {
        flex: 1;
      }

      .ant-tabs-nav-list {
        width: 100%;
      }

      .ant-tabs-tab {
        width: 80px;
        padding: ${SPACE_SM} ${SPACE_MD};
        margin: 0;
        font-weight: ${FONT_WEIGHT_REGULAR};
        color: ${p => p.theme.textColorLight};

        &.ant-tabs-tab-active {
          font-weight: ${FONT_WEIGHT_MEDIUM};
          color: ${p => p.theme.textColor};
          background-color: ${p => p.theme.bodyBackground};
          border-radius: ${BORDER_RADIUS};
        }
      }

      .ant-tabs-ink-bar {
        width: 3px;
        border-radius: ${BORDER_RADIUS};
      }
    }

    > .ant-tabs-content-holder {
      display: flex;
      flex: 1;
      min-width: 0;
      height: 100%;
      padding: ${SPACE_XS};
      margin-left: ${SPACE_XS};
      color: ${p => p.theme.textColorLight};
      background-color: ${p => p.theme.componentBackground};
      border-radius: ${BORDER_RADIUS};

      > .ant-tabs-content {
        display: flex;
        flex: 1;
        height: 100%;
        overflow-y: auto;

        > .ant-tabs-tabpane {
          width: 100%;
        }
      }
    }
  }
`;

const StyledPanel = styled.div<{ $vertical: boolean }>`
  ${p =>
    p.$vertical &&
    `display: flex;
     flex-direction: column;
     width: 288px;
     height: 100%;
     flex-shrink: 0;`}
`;

const LayoutToolbar = styled.div<{ $vertical: boolean }>`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: ${SPACE_XS};
`;

const LayoutLabel = styled.span`
  margin-right: ${SPACE_XS};
  font-size: ${FONT_SIZE_BODY};
  color: ${p => p.theme.textColorLight};
`;

const StyledChartGraphPanel = styled.div`
  display: flex;
  flex-flow: row wrap;
  align-content: flex-start;
  min-height: 40px;
`;

const StyledEmpty = styled(Empty)`
  width: 100%;
  margin: ${SPACE_MD} 0;
`;
