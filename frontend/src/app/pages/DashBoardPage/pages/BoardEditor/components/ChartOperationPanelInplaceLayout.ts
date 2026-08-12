/**
 * Datart
 *
 * Copyright 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in the License at
 * www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { IJsonModel } from 'flexlayout-react';
import { LayoutComponentType } from 'app/pages/ChartWorkbenchPage/components/ChartOperationPanel/ChartOperationPanelLayout';

// 原位配置专用布局：仅保留「数据源面板」+「图表配置面板」，去掉预览区（ChartPresentWrapper）
const inplaceLayout: IJsonModel = {
  global: {
    tabEnableFloat: true,
    tabEnableClose: false,
    tabSetEnableTabStrip: false,
    splitterSize: 2,
  },
  layout: {
    type: 'row',
    id: 'container',
    children: [
      {
        type: 'tabset',
        id: 'model-dragbar',
        weight: 1,
        minWidth: 150,
        children: [
          {
            type: 'tab',
            id: 'model-dragbar-component',
            component: LayoutComponentType.VIEW,
          },
        ],
      },
      {
        type: 'tabset',
        id: 'config',
        weight: 2,
        minWidth: 300,
        children: [
          {
            type: 'tab',
            id: 'config-component',
            component: LayoutComponentType.CONFIG,
          },
        ],
      },
    ],
  },
};

export default inplaceLayout;
