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

import useResizeObserver from 'app/hooks/useResizeObserver';
import ChartManager from 'app/models/ChartManager';
import ChartI18NContext from 'app/pages/ChartWorkbenchPage/contexts/Chart18NContext';
import { IChart } from 'app/types/Chart';
import { ChartConfig, SelectedItem } from 'app/types/ChartConfig';
import ChartDataSetDTO from 'app/types/ChartDataSet';
import ChartDataView from 'app/types/ChartDataView';
import { FC, memo, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { SPACE_MD, SPACE_XS } from 'styles/StyleConstants';
import ChartGraphPanel from './ChartGraphPanel';
import ChartPresentPanel from './ChartPresentPanel';

type PanelLayout = 'horizontal' | 'vertical';

const ChartPresentWrapper: FC<{
  containerHeight?: number;
  containerWidth?: number;
  chart?: IChart;
  dataset?: ChartDataSetDTO;
  chartConfig?: ChartConfig;
  expensiveQuery: boolean;
  allowQuery: boolean;
  onChartChange: (c: IChart) => void;
  onRefreshDataset?: () => void;
  onCreateDownloadDataTask?: () => void;
  dataView?: ChartDataView;
  selectedItems?: SelectedItem[];
}> = memo(
  ({
    containerHeight,
    containerWidth,
    chart,
    dataset,
    expensiveQuery,
    chartConfig,
    allowQuery,
    dataView,
    onChartChange,
    onRefreshDataset,
    onCreateDownloadDataTask,
    selectedItems,
  }) => {
    const { ref: ChartGraphPanelRef } = useResizeObserver<any>({
      refreshMode: 'debounce',
      refreshRate: 500,
    });
    const {
      ref: PresentPanelRef,
      width: presentPanelWidth,
      height: presentPanelHeight,
    } = useResizeObserver<any>({
      refreshMode: 'debounce',
      refreshRate: 500,
    });

    const [layoutDirection, setLayoutDirection] = useState<PanelLayout>(() =>
      ChartManager.getChartPanelLayout(),
    );
    const isVertical = layoutDirection === 'vertical';

    const borderWidth = useMemo(() => {
      return +SPACE_MD.replace('px', '');
    }, []);

    const handleLayoutDirectionChange = useCallback(
      (layout: PanelLayout) => {
        setLayoutDirection(layout);
        ChartManager.saveChartPanelLayout(layout);
      },
      [],
    );

    return (
      <StyledChartPresentWrapper borderWidth={borderWidth} $vertical={isVertical}>
        <ChartI18NContext.Provider value={{ i18NConfigs: chartConfig?.i18ns }}>
          {isVertical ? (
            <>
              <StyledGraphPanelContainer ref={ChartGraphPanelRef}>
                <ChartGraphPanel
                  chart={chart}
                  chartConfig={chartConfig}
                  layoutDirection={layoutDirection}
                  onLayoutDirectionChange={handleLayoutDirectionChange}
                  onChartChange={onChartChange}
                />
              </StyledGraphPanelContainer>
              <StyledPresentPanelContainer
                ref={PresentPanelRef}
                $vertical={isVertical}
              >
                <ChartPresentPanel
                  containerHeight={presentPanelHeight || 0}
                  containerWidth={
                    (presentPanelWidth || 0) - borderWidth
                  }
                  chart={chart}
                  dataset={dataset}
                  expensiveQuery={expensiveQuery}
                  allowQuery={allowQuery}
                  chartConfig={chartConfig}
                  onRefreshDataset={onRefreshDataset}
                  onCreateDownloadDataTask={onCreateDownloadDataTask}
                  selectedItems={selectedItems}
                  dataView={dataView}
                />
              </StyledPresentPanelContainer>
            </>
          ) : (
            <>
              <div ref={ChartGraphPanelRef}>
                <ChartGraphPanel
                  chart={chart}
                  chartConfig={chartConfig}
                  layoutDirection={layoutDirection}
                  onLayoutDirectionChange={handleLayoutDirectionChange}
                  onChartChange={onChartChange}
                />
              </div>
              <ChartPresentPanel
                containerHeight={
                  (containerHeight || 0) -
                  borderWidth -
                  (ChartGraphPanelRef?.current?.offsetHeight || 0)
                }
                containerWidth={(containerWidth || 0) - borderWidth}
                chart={chart}
                dataset={dataset}
                expensiveQuery={expensiveQuery}
                allowQuery={allowQuery}
                chartConfig={chartConfig}
                onRefreshDataset={onRefreshDataset}
                onCreateDownloadDataTask={onCreateDownloadDataTask}
                selectedItems={selectedItems}
                dataView={dataView}
              />
            </>
          )}
        </ChartI18NContext.Provider>
      </StyledChartPresentWrapper>
    );
  },
);

export default ChartPresentWrapper;

const StyledChartPresentWrapper = styled.div<{
  borderWidth;
  $vertical: boolean;
}>`
  display: flex;
  flex-direction: ${p => (p.$vertical ? 'row' : 'column')};
  height: 100%;
  padding: ${p => p.borderWidth}px ${p => p.borderWidth}px
    ${p => p.borderWidth}px 0;
  background-color: ${p => p.theme.bodyBackground};
`;

const StyledGraphPanelContainer = styled.div`
  display: flex;
  min-width: 0;
`;

const StyledPresentPanelContainer = styled.div<{ $vertical: boolean }>`
  display: flex;
  flex: 1;
  min-width: 0;
  margin-left: ${SPACE_XS};
`;
