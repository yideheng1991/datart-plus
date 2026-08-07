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

import { ChartConfig } from 'app/types/ChartConfig';

const config: ChartConfig = {
  datas: [
    {
      label: 'dimension',
      key: 'dimension',
      type: 'group',
      limit: [0, 1],
    },
    {
      label: 'metrics',
      key: 'metrics',
      required: true,
      rows: [],
      type: 'aggregate',
    },
    {
      label: 'filter',
      key: 'filter',
      type: 'filter',
      allowSameField: true,
    },
    {
      label: 'colorize',
      key: 'color',
      type: 'color',
      limit: [0, 1],
    },
    {
      label: 'info',
      key: 'info',
      type: 'info',
    },
  ],
  styles: [
    {
      label: 'radarAxis.title',
      key: 'radarAxis',
      comType: 'group',
      rows: [
        {
          label: 'radarAxis.shape',
          key: 'shape',
          default: 'polygon',
          comType: 'select',
          options: {
            translateItemLabel: true,
            items: [
              {
                label: 'radarAxis.polygon',
                value: 'polygon',
              },
              {
                label: 'radarAxis.circle',
                value: 'circle',
              },
            ],
          },
        },
        {
          label: 'radarAxis.radius',
          key: 'radius',
          default: '65%',
          comType: 'marginWidth',
        },
        {
          label: 'radarAxis.centerX',
          key: 'centerX',
          default: '50%',
          comType: 'marginWidth',
        },
        {
          label: 'radarAxis.centerY',
          key: 'centerY',
          default: '50%',
          comType: 'marginWidth',
        },
        {
          label: 'radarAxis.startAngle',
          key: 'startAngle',
          default: 90,
          comType: 'inputNumber',
          options: {
            min: -360,
            max: 360,
          },
        },
        {
          label: 'radarAxis.splitNumber',
          key: 'splitNumber',
          default: 5,
          comType: 'inputNumber',
          options: {
            min: 1,
            step: 1,
          },
        },
        {
          label: 'radarAxis.maxValues',
          key: 'maxValues',
          default: [],
          comType: 'radarIndicatorMax',
        },
      ],
    },
    {
      label: 'axisName.title',
      key: 'axisName',
      comType: 'group',
      rows: [
        {
          label: 'axisName.show',
          key: 'show',
          default: true,
          comType: 'checkbox',
        },
        {
          label: 'viz.palette.style.font',
          key: 'font',
          comType: 'font',
          default: {
            fontFamily: 'PingFang SC',
            fontSize: '12',
            fontWeight: 'normal',
            fontStyle: 'normal',
            color: '#495057',
          },
          watcher: {
            deps: ['show'],
            action: props => {
              return {
                disabled: !props.show,
              };
            },
          },
        },
      ],
    },
    {
      label: 'axisLine.title',
      key: 'axisLine',
      comType: 'group',
      rows: [
        {
          label: 'axisLine.show',
          key: 'show',
          default: true,
          comType: 'checkbox',
        },
        {
          label: 'common.lineStyle',
          key: 'lineStyle',
          comType: 'line',
          default: {
            type: 'solid',
            width: 1,
            color: '#ced4da',
          },
          watcher: {
            deps: ['show'],
            action: props => {
              return {
                disabled: !props.show,
              };
            },
          },
        },
      ],
    },
    {
      label: 'splitLine.title',
      key: 'splitLine',
      comType: 'group',
      rows: [
        {
          label: 'splitLine.show',
          key: 'show',
          default: true,
          comType: 'checkbox',
        },
        {
          label: 'common.lineStyle',
          key: 'lineStyle',
          comType: 'line',
          default: {
            type: 'solid',
            width: 1,
            color: '#ced4da',
          },
          watcher: {
            deps: ['show'],
            action: props => {
              return {
                disabled: !props.show,
              };
            },
          },
        },
      ],
    },
    {
      label: 'splitArea.title',
      key: 'splitArea',
      comType: 'group',
      rows: [
        {
          label: 'splitArea.show',
          key: 'show',
          default: true,
          comType: 'checkbox',
        },
        {
          label: 'splitArea.color',
          key: 'color',
          default: '#f8f9fa',
          comType: 'fontColor',
          watcher: {
            deps: ['show'],
            action: props => {
              return {
                disabled: !props.show,
              };
            },
          },
        },
        {
          label: 'splitArea.opacity',
          key: 'opacity',
          default: 0.5,
          comType: 'slider',
          options: {
            min: 0,
            max: 1,
            step: 0.1,
            dots: false,
          },
          watcher: {
            deps: ['show'],
            action: props => {
              return {
                disabled: !props.show,
              };
            },
          },
        },
      ],
    },
    {
      label: 'radarSeries.title',
      key: 'radarSeries',
      comType: 'group',
      rows: [
        {
          label: 'radarSeries.symbol',
          key: 'symbol',
          default: 'circle',
          comType: 'select',
          options: {
            translateItemLabel: true,
            items: [
              {
                label: 'radarSeries.circle',
                value: 'circle',
              },
              {
                label: 'radarSeries.rect',
                value: 'rect',
              },
              {
                label: 'radarSeries.roundRect',
                value: 'roundRect',
              },
              {
                label: 'radarSeries.triangle',
                value: 'triangle',
              },
              {
                label: 'radarSeries.diamond',
                value: 'diamond',
              },
              {
                label: 'radarSeries.none',
                value: 'none',
              },
            ],
          },
        },
        {
          label: 'radarSeries.symbolSize',
          key: 'symbolSize',
          default: 4,
          comType: 'inputNumber',
          options: {
            min: 0,
          },
        },
        {
          label: 'radarSeries.lineType',
          key: 'lineType',
          default: 'solid',
          comType: 'select',
          options: {
            translateItemLabel: true,
            items: [
              {
                label: 'radarSeries.solid',
                value: 'solid',
              },
              {
                label: 'radarSeries.dashed',
                value: 'dashed',
              },
              {
                label: 'radarSeries.dotted',
                value: 'dotted',
              },
            ],
          },
        },
        {
          label: 'radarSeries.lineWidth',
          key: 'lineWidth',
          default: 2,
          comType: 'inputNumber',
          options: {
            min: 0,
          },
        },
        {
          label: 'radarSeries.areaOpacity',
          key: 'areaOpacity',
          default: 0.15,
          comType: 'slider',
          options: {
            min: 0,
            max: 1,
            step: 0.1,
            dots: false,
          },
        },
      ],
    },
    {
      label: 'label.title',
      key: 'label',
      comType: 'group',
      rows: [
        {
          label: 'label.showLabel',
          key: 'showLabel',
          default: false,
          comType: 'checkbox',
        },
        {
          label: 'viz.palette.style.font',
          key: 'font',
          comType: 'font',
          default: {
            fontFamily: 'PingFang SC',
            fontSize: '12',
            fontWeight: 'normal',
            fontStyle: 'normal',
            color: '#495057',
          },
          watcher: {
            deps: ['showLabel'],
            action: props => {
              return {
                disabled: !props.showLabel,
              };
            },
          },
        },
      ],
    },
    {
      label: 'legend.title',
      key: 'legend',
      comType: 'group',
      rows: [
        {
          label: 'legend.showLegend',
          key: 'showLegend',
          default: true,
          comType: 'checkbox',
        },
        {
          label: 'legend.type',
          key: 'type',
          comType: 'legendType',
          default: 'scroll',
        },
        {
          label: 'legend.selectAll',
          key: 'selectAll',
          default: true,
          comType: 'checkbox',
        },
        {
          label: 'legend.position',
          key: 'position',
          comType: 'legendPosition',
          default: 'right',
        },
        {
          label: 'legend.height',
          key: 'height',
          default: 0,
          comType: 'inputNumber',
          options: {
            step: 40,
            min: 0,
          },
        },
        {
          label: 'viz.palette.style.font',
          key: 'font',
          comType: 'font',
          default: {
            fontFamily: 'PingFang SC',
            fontSize: '12',
            fontWeight: 'normal',
            fontStyle: 'normal',
            color: '#495057',
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
            min: 0,
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
        common: {
          lineStyle: '线条样式',
        },
        label: {
          title: '数据标签',
          showLabel: '显示系列名称',
        },
        legend: {
          title: '图例',
          showLegend: '显示图例',
          type: '图例类型',
          selectAll: '图例全选',
          position: '图例位置',
          height: '图例高度',
        },
        radarAxis: {
          title: '雷达轴',
          shape: '形状',
          polygon: '多边形',
          circle: '圆形',
          radius: '半径',
          centerX: '水平位置',
          centerY: '垂直位置',
          startAngle: '起始角度',
          splitNumber: '分割段数',
          maxValues: '指标最大值',
          noMetrics: '请先在数据面板添加指标',
          autoMax: '自动',
        },
        axisName: {
          title: '指标名称',
          show: '显示指标名称',
        },
        axisLine: {
          title: '轴线',
          show: '显示轴线',
        },
        splitLine: {
          title: '分割线',
          show: '显示分割线',
        },
        splitArea: {
          title: '分割区域',
          show: '显示分割区域',
          color: '区域颜色',
          opacity: '区域透明度',
        },
        radarSeries: {
          title: '雷达数据',
          symbol: '标记图形',
          symbolSize: '标记大小',
          lineType: '线条类型',
          lineWidth: '线条宽度',
          areaOpacity: '填充透明度',
          circle: '圆形',
          rect: '矩形',
          roundRect: '圆角矩形',
          triangle: '三角形',
          diamond: '菱形',
          none: '无',
          solid: '实线',
          dashed: '虚线',
          dotted: '点线',
        },
      },
    },
    {
      lang: 'en-US',
      translation: {
        common: {
          lineStyle: 'Line Style',
        },
        label: {
          title: 'Data Label',
          showLabel: 'Show Series Name',
        },
        legend: {
          title: 'Legend',
          showLegend: 'Show Legend',
          type: 'Legend Type',
          selectAll: 'Select All',
          position: 'Position',
          height: 'Height',
        },
        radarAxis: {
          title: 'Radar Axis',
          shape: 'Shape',
          polygon: 'Polygon',
          circle: 'Circle',
          radius: 'Radius',
          centerX: 'Horizontal Position',
          centerY: 'Vertical Position',
          startAngle: 'Start Angle',
          splitNumber: 'Split Number',
          maxValues: 'Indicator Maximums',
          noMetrics: 'Add metrics in the data panel first',
          autoMax: 'Auto',
        },
        axisName: {
          title: 'Indicator Name',
          show: 'Show Indicator Name',
        },
        axisLine: {
          title: 'Axis Line',
          show: 'Show Axis Line',
        },
        splitLine: {
          title: 'Split Line',
          show: 'Show Split Line',
        },
        splitArea: {
          title: 'Split Area',
          show: 'Show Split Area',
          color: 'Area Color',
          opacity: 'Area Opacity',
        },
        radarSeries: {
          title: 'Radar Data',
          symbol: 'Symbol',
          symbolSize: 'Symbol Size',
          lineType: 'Line Type',
          lineWidth: 'Line Width',
          areaOpacity: 'Area Opacity',
          circle: 'Circle',
          rect: 'Rectangle',
          roundRect: 'Rounded Rectangle',
          triangle: 'Triangle',
          diamond: 'Diamond',
          none: 'None',
          solid: 'Solid',
          dashed: 'Dashed',
          dotted: 'Dotted',
        },
      },
    },
  ],
};

export default config;
