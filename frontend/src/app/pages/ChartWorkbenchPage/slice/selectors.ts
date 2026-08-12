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

import { createSelector } from '@reduxjs/toolkit';
import { ResourceTypes } from 'app/pages/MainPage/pages/PermissionPage/constants';
import ChartDataView from 'app/types/ChartDataView';
import { RootState } from 'types';
import { listToTree } from 'utils/utils';
import { initState } from '.';

const workbenchSelector = (state: RootState) => state.workbench || initState;

const boardViewMapSelector = (state: RootState) =>
  (state.board && state.board.viewMap) || {};

// 在仪表板（原位配置）场景下复用 workbench 数据源面板时，workbench 的 dataviews 为空，
// 此时回退到仪表板已加载的 viewMap，使数据源（视图）下拉框有可选项。
export const dataviewsSelector = createSelector(
  [workbenchSelector, boardViewMapSelector],
  (wb, boardViewMap) => {
    if (wb.dataviews && wb.dataviews.length) {
      return wb.dataviews;
    }
    return Object.values(boardViewMap || {}) as ChartDataView[];
  },
);

// TODO(Stephen): fix to use pure action creator
export const makeDataviewTreeSelector = () =>
  createSelector(
    [
      dataviewsSelector,
      (_, getSelectable: (o: ChartDataView) => boolean) => getSelectable,
    ],
    (dataviews, getSelectable) =>
      listToTree(dataviews, null, [ResourceTypes.View], { getSelectable }),
  );

export const currentDataViewSelector = createSelector(
  workbenchSelector,
  wb => wb.currentDataView,
);

export const datasetsSelector = createSelector(workbenchSelector, wb => {
  if (!wb.currentDataView?.id && wb.backendChart?.config.sampleData) {
    return wb.backendChart?.config.sampleData;
  }
  return wb.dataset;
});

export const languageSelector = createSelector(
  workbenchSelector,
  wb => wb.lang,
);

export const dateFormatSelector = createSelector(
  workbenchSelector,
  wb => wb.dateFormat,
);

export const chartConfigSelector = createSelector(
  workbenchSelector,
  wb => wb.chartConfig,
);

export const backendChartSelector = createSelector(
  workbenchSelector,
  wb => wb.backendChart,
);

export const shadowChartConfigSelector = createSelector(
  workbenchSelector,
  wb => wb.shadowChartConfig,
);

export const aggregationSelector = createSelector(
  workbenchSelector,
  wb => wb.aggregation,
);

export const datasetLoadingSelector = createSelector(
  workbenchSelector,
  wb => wb.datasetLoading,
);

export const selectChartEditorDownloadPolling = createSelector(
  workbenchSelector,
  wb => wb.chartEditorDownloadPolling,
);

export const selectAvailableSourceFunctions = createSelector(
  workbenchSelector,
  wb => wb.availableSourceFunctions,
);

export const selectSelectedItems = createSelector(
  workbenchSelector,
  wb => wb.selectedItems,
);
