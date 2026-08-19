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

import { AggregateFieldActionType } from 'app/constants';
import { ChartConfig, ChartDataConfig } from 'app/types/ChartConfig';

const STATISTIC_DEFAULT_AGGREGATE = {
  min: AggregateFieldActionType.Min,
  q1: AggregateFieldActionType.Quartile1,
  median: AggregateFieldActionType.Median,
  q3: AggregateFieldActionType.Quartile3,
  max: AggregateFieldActionType.Max,
};

const createStatisticConfig = (key: string): ChartDataConfig => ({
  label: key,
  key,
  type: 'aggregate',
  required: true,
  limit: 1,
  defaultAggregate: STATISTIC_DEFAULT_AGGREGATE[key],
  actions: {
    NUMERIC: ['aggregate', 'alias', 'format'],
  },
});

const config: ChartConfig = {
  datas: [
    {
      label: 'dimension',
      key: 'dimension',
      type: 'group',
      required: true,
      limit: 1,
      actions: {
        NUMERIC: ['sortable', 'alias'],
        STRING: ['sortable', 'alias'],
        DATE: ['sortable', 'alias'],
      },
    },
    createStatisticConfig('min'),
    createStatisticConfig('q1'),
    createStatisticConfig('median'),
    createStatisticConfig('q3'),
    createStatisticConfig('max'),
    {
      label: 'outlier',
      key: 'outlier',
      type: 'aggregate',
      limit: [0, 999],
      actions: {
        NUMERIC: ['aggregate', 'alias', 'format'],
      },
    },
    {
      label: 'filter',
      key: 'filter',
      type: 'filter',
      allowSameField: true,
    },
  ],
  styles: [
    {
      label: 'general.title',
      key: 'general',
      comType: 'group',
      rows: [
        {
          label: 'general.orientation',
          key: 'orientation',
          default: 'vertical',
          comType: 'select',
          options: {
            translateItemLabel: true,
            items: [
              { label: 'general.vertical', value: 'vertical' },
              { label: 'general.horizontal', value: 'horizontal' },
            ],
          },
        },
        {
          label: 'general.backgroundColor',
          key: 'backgroundColor',
          default: 'rgba(0, 0, 0, 0)',
          comType: 'fontColor',
        },
        {
          label: 'general.showTooltip',
          key: 'showTooltip',
          default: true,
          comType: 'checkbox',
        },
        {
          label: 'general.animation',
          key: 'animation',
          default: true,
          comType: 'checkbox',
        },
      ],
    },
    {
      label: 'title.title',
      key: 'title',
      comType: 'group',
      rows: [
        {
          label: 'title.show',
          key: 'show',
          default: true,
          comType: 'checkbox',
        },
        {
          label: 'title.text',
          key: 'text',
          default: '',
          comType: 'input',
        },
        {
          label: 'title.position',
          key: 'position',
          default: 'center',
          comType: 'select',
          options: {
            translateItemLabel: true,
            items: [
              { label: 'title.left', value: 'left' },
              { label: 'title.center', value: 'center' },
              { label: 'title.right', value: 'right' },
            ],
          },
        },
        {
          label: 'title.font',
          key: 'font',
          comType: 'font',
          default: {
            fontFamily: 'PingFang SC',
            fontSize: '16',
            fontWeight: 'bold',
            fontStyle: 'normal',
            color: '#333333',
          },
        },
      ],
    },
    {
      label: 'categoryAxis.title',
      key: 'categoryAxis',
      comType: 'group',
      rows: [
        {
          label: 'categoryAxis.show',
          key: 'show',
          default: true,
          comType: 'checkbox',
        },
        {
          label: 'categoryAxis.name',
          key: 'name',
          default: '',
          comType: 'input',
        },
        {
          label: 'categoryAxis.rotate',
          key: 'rotate',
          default: 0,
          comType: 'inputNumber',
          options: {
            min: -90,
            max: 90,
          },
        },
        {
          label: 'categoryAxis.font',
          key: 'font',
          comType: 'font',
          default: {
            fontFamily: 'PingFang SC',
            fontSize: '12',
            fontWeight: 'normal',
            fontStyle: 'normal',
            color: '#666666',
          },
        },
      ],
    },
    {
      label: 'valueAxis.title',
      key: 'valueAxis',
      comType: 'group',
      rows: [
        {
          label: 'valueAxis.show',
          key: 'show',
          default: true,
          comType: 'checkbox',
        },
        {
          label: 'valueAxis.name',
          key: 'name',
          default: '',
          comType: 'input',
        },
        {
          label: 'valueAxis.showSplitArea',
          key: 'showSplitArea',
          default: true,
          comType: 'checkbox',
        },
        {
          label: 'valueAxis.showSplitLine',
          key: 'showSplitLine',
          default: true,
          comType: 'checkbox',
        },
        {
          label: 'valueAxis.splitLineColor',
          key: 'splitLineColor',
          default: '#e8e8e8',
          comType: 'fontColor',
        },
        {
          label: 'valueAxis.font',
          key: 'font',
          comType: 'font',
          default: {
            fontFamily: 'PingFang SC',
            fontSize: '12',
            fontWeight: 'normal',
            fontStyle: 'normal',
            color: '#666666',
          },
        },
      ],
    },
    {
      label: 'box.title',
      key: 'box',
      comType: 'group',
      rows: [
        {
          label: 'box.fill',
          key: 'fill',
          default: '#ffffff',
          comType: 'fontColor',
        },
        {
          label: 'box.borderColor',
          key: 'borderColor',
          default: '#5470c6',
          comType: 'fontColor',
        },
        {
          label: 'box.borderWidth',
          key: 'borderWidth',
          default: 2,
          comType: 'inputNumber',
          options: {
            min: 0,
          },
        },
        {
          label: 'box.borderType',
          key: 'borderType',
          default: 'solid',
          comType: 'select',
          options: {
            translateItemLabel: true,
            items: [
              { label: 'box.solid', value: 'solid' },
              { label: 'box.dashed', value: 'dashed' },
              { label: 'box.dotted', value: 'dotted' },
            ],
          },
        },
        {
          label: 'box.minWidth',
          key: 'minWidth',
          default: 7,
          comType: 'inputNumber',
          options: {
            min: 0,
          },
        },
        {
          label: 'box.maxWidth',
          key: 'maxWidth',
          default: 50,
          comType: 'inputNumber',
          options: {
            min: 0,
          },
        },
      ],
    },
    {
      label: 'outlier.title',
      key: 'outlier',
      comType: 'group',
      rows: [
        {
          label: 'outlier.show',
          key: 'show',
          default: true,
          comType: 'checkbox',
        },
        {
          label: 'outlier.color',
          key: 'color',
          default: '#e06343',
          comType: 'fontColor',
        },
        {
          label: 'outlier.symbolSize',
          key: 'symbolSize',
          default: 8,
          comType: 'inputNumber',
          options: {
            min: 1,
          },
        },
      ],
    },
    {
      label: 'zoom.title',
      key: 'zoom',
      comType: 'group',
      rows: [
        {
          label: 'zoom.show',
          key: 'show',
          default: false,
          comType: 'checkbox',
        },
        {
          label: 'zoom.start',
          key: 'start',
          default: 0,
          comType: 'inputNumber',
          options: {
            min: 0,
            max: 100,
          },
        },
        {
          label: 'zoom.end',
          key: 'end',
          default: 100,
          comType: 'inputNumber',
          options: {
            min: 0,
            max: 100,
          },
        },
      ],
    },
    {
      label: 'margin.title',
      key: 'margin',
      comType: 'group',
      rows: [
        {
          label: 'margin.containLabel',
          key: 'containLabel',
          default: true,
          comType: 'checkbox',
        },
        {
          label: 'margin.left',
          key: 'left',
          default: 40,
          comType: 'inputNumber',
          options: {
            min: 0,
          },
        },
        {
          label: 'margin.right',
          key: 'right',
          default: 30,
          comType: 'inputNumber',
          options: {
            min: 0,
          },
        },
        {
          label: 'margin.top',
          key: 'top',
          default: 60,
          comType: 'inputNumber',
          options: {
            min: 0,
          },
        },
        {
          label: 'margin.bottom',
          key: 'bottom',
          default: 60,
          comType: 'inputNumber',
          options: {
            min: 0,
          },
        },
      ],
    },
  ],
  settings: [
    {
      label: 'viz.palette.setting.paging.title',
      key: 'paging',
      comType: 'group',
      rows: [
        {
          label: 'viz.palette.setting.paging.pageSize',
          key: 'pageSize',
          default: 1000,
          comType: 'inputNumber',
          options: {
            needRefresh: true,
            step: 1,
            min: 1,
          },
        },
      ],
    },
  ],
  interactions: [
    {
      label: 'drillThrough.title',
      key: 'drillThrough',
      comType: 'checkboxModal',
      default: false,
      options: { modalSize: 'middle' },
      rows: [
        {
          label: 'drillThrough.title',
          key: 'setting',
          comType: 'interaction.drillThrough',
        },
      ],
    },
    {
      label: 'viewDetail.title',
      key: 'viewDetail',
      comType: 'checkboxModal',
      default: false,
      options: { modalSize: 'middle' },
      rows: [
        {
          label: 'viewDetail.title',
          key: 'setting',
          comType: 'interaction.viewDetail',
        },
      ],
    },
  ],
  i18ns: [
    {
      lang: 'zh-CN',
      translation: {
        boxPlot: '箱线图',
        viz: {
          palette: {
            data: {
              dimension: '维度',
              min: '最小值',
              q1: '下四分位数（Q1）',
              median: '中位数',
              q3: '上四分位数（Q3）',
              max: '最大值',
              outlier: '离群值（可选）',
              filter: '筛选',
            },
          },
        },
        general: {
          title: '常规',
          orientation: '布局方向',
          vertical: '垂直',
          horizontal: '水平',
          backgroundColor: '背景颜色',
          showTooltip: '显示提示框',
          animation: '开启动画',
        },
        title: {
          title: '标题',
          show: '显示标题',
          text: '标题文本',
          position: '标题位置',
          left: '左侧',
          center: '居中',
          right: '右侧',
          font: '标题字体',
        },
        categoryAxis: {
          title: '分类轴',
          show: '显示分类轴',
          name: '分类轴名称',
          rotate: '分类标签旋转角度',
          font: '分类轴字体',
        },
        valueAxis: {
          title: '数值轴',
          show: '显示数值轴',
          name: '数值轴名称',
          showSplitArea: '显示数值轴分隔区域',
          showSplitLine: '显示数值轴分隔线',
          splitLineColor: '分隔线颜色',
          font: '数值轴字体',
        },
        box: {
          title: '箱体样式',
          fill: '填充颜色',
          borderColor: '边框颜色',
          borderWidth: '边框宽度',
          borderType: '边框类型',
          solid: '实线',
          dashed: '虚线',
          dotted: '点线',
          minWidth: '最小宽度',
          maxWidth: '最大宽度',
        },
        outlier: {
          title: '离群点',
          show: '显示离群点',
          color: '点颜色',
          symbolSize: '点大小',
        },
        zoom: {
          title: '区域缩放',
          show: '显示缩放组件',
          start: '起始百分比',
          end: '结束百分比',
        },
        margin: {
          title: '边距',
          containLabel: '包含坐标轴标签',
          left: '左边距',
          right: '右边距',
          top: '上边距',
          bottom: '下边距',
        },
        paging: {
          title: '数据查询',
          pageSize: '最大数据行数',
        },
      },
    },
    {
      lang: 'en-US',
      translation: {
        boxPlot: 'Boxplot',
        viz: {
          palette: {
            data: {
              dimension: 'Dimension',
              min: 'Minimum',
              q1: 'Lower Quartile (Q1)',
              median: 'Median',
              q3: 'Upper Quartile (Q3)',
              max: 'Maximum',
              outlier: 'Outliers (Optional)',
              filter: 'Filter',
            },
          },
        },
        general: {
          title: 'General',
          orientation: 'Orientation',
          vertical: 'Vertical',
          horizontal: 'Horizontal',
          backgroundColor: 'Background Color',
          showTooltip: 'Show Tooltip',
          animation: 'Enable Animation',
        },
        title: {
          title: 'Title',
          show: 'Show Title',
          text: 'Title Text',
          position: 'Title Position',
          left: 'Left',
          center: 'Center',
          right: 'Right',
          font: 'Title Font',
        },
        categoryAxis: {
          title: 'Category Axis',
          show: 'Show Category Axis',
          name: 'Category Axis Name',
          rotate: 'Category Label Rotation',
          font: 'Category Axis Font',
        },
        valueAxis: {
          title: 'Value Axis',
          show: 'Show Value Axis',
          name: 'Value Axis Name',
          showSplitArea: 'Show Value Split Area',
          showSplitLine: 'Show Value Split Line',
          splitLineColor: 'Split Line Color',
          font: 'Value Axis Font',
        },
        box: {
          title: 'Box Style',
          fill: 'Fill Color',
          borderColor: 'Border Color',
          borderWidth: 'Border Width',
          borderType: 'Border Type',
          solid: 'Solid',
          dashed: 'Dashed',
          dotted: 'Dotted',
          minWidth: 'Minimum Width',
          maxWidth: 'Maximum Width',
        },
        outlier: {
          title: 'Outlier',
          show: 'Show Outliers',
          color: 'Point Color',
          symbolSize: 'Point Size',
        },
        zoom: {
          title: 'Data Zoom',
          show: 'Show Data Zoom',
          start: 'Start Percentage',
          end: 'End Percentage',
        },
        margin: {
          title: 'Grid Margin',
          containLabel: 'Contain Axis Labels',
          left: 'Left',
          right: 'Right',
          top: 'Top',
          bottom: 'Bottom',
        },
      },
    },
  ],
};

export default config;
