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
      label: 'mixed',
      key: 'mixed',
      required: true,
      type: 'mixed',
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
      label: 'scrollBoard.basic',
      key: 'basic',
      comType: 'group',
      rows: [
        {
          label: 'scrollBoard.rowNum',
          key: 'rowNum',
          default: 5,
          comType: 'inputNumber',
          options: {
            min: 1,
            step: 1,
          },
        },
        {
          label: 'scrollBoard.waitTime',
          key: 'waitTime',
          default: 2000,
          comType: 'inputNumber',
          options: {
            min: 100,
            step: 100,
          },
        },
        {
          label: 'scrollBoard.headerHeight',
          key: 'headerHeight',
          default: 35,
          comType: 'inputNumber',
          options: {
            min: 0,
            step: 1,
          },
        },
        {
          label: 'scrollBoard.carousel',
          key: 'carousel',
          default: 'single',
          comType: 'select',
          options: {
            translateItemLabel: true,
            items: [
              { label: 'scrollBoard.carouselOptions.single', value: 'single' },
              { label: 'scrollBoard.carouselOptions.page', value: 'page' },
            ],
          },
        },
        {
          label: 'scrollBoard.hoverPause',
          key: 'hoverPause',
          default: true,
          comType: 'checkbox',
        },
      ],
    },
    {
      label: 'scrollBoard.header',
      key: 'header',
      comType: 'group',
      rows: [
        {
          label: 'scrollBoard.headerBGC',
          key: 'headerBGC',
          default: '#00BAFF',
          comType: 'fontColor',
        },
        {
          label: 'scrollBoard.headerFont',
          key: 'headerFont',
          comType: 'font',
          default: {
            fontFamily: 'Microsoft YaHei',
            fontSize: 14,
            fontWeight: 'bold',
            fontStyle: 'normal',
            color: '#fff',
          },
        },
        {
          label: 'scrollBoard.headerAlign',
          key: 'headerAlign',
          default: 'center',
          comType: 'select',
          options: {
            translateItemLabel: true,
            items: [
              { label: 'scrollBoard.alignOptions.left', value: 'left' },
              { label: 'scrollBoard.alignOptions.center', value: 'center' },
              { label: 'scrollBoard.alignOptions.right', value: 'right' },
            ],
          },
        },
        {
          label: 'scrollBoard.index',
          key: 'index',
          default: true,
          comType: 'checkbox',
        },
        {
          label: 'scrollBoard.indexHeader',
          key: 'indexHeader',
          default: '#',
          comType: 'input',
        },
        {
          label: 'scrollBoard.indexAlign',
          key: 'indexAlign',
          default: 'center',
          comType: 'select',
          options: {
            translateItemLabel: true,
            items: [
              { label: 'scrollBoard.alignOptions.left', value: 'left' },
              { label: 'scrollBoard.alignOptions.center', value: 'center' },
              { label: 'scrollBoard.alignOptions.right', value: 'right' },
            ],
          },
        },
      ],
    },
    {
      label: 'scrollBoard.body',
      key: 'body',
      comType: 'group',
      rows: [
        {
          label: 'scrollBoard.oddRowBGC',
          key: 'oddRowBGC',
          default: '#003B51',
          comType: 'fontColor',
        },
        {
          label: 'scrollBoard.evenRowBGC',
          key: 'evenRowBGC',
          default: '#0A2732',
          comType: 'fontColor',
        },
        {
          label: 'scrollBoard.bodyFont',
          key: 'bodyFont',
          comType: 'font',
          default: {
            fontFamily: 'Microsoft YaHei',
            fontSize: 14,
            fontWeight: 'normal',
            fontStyle: 'normal',
            color: '#fff',
          },
        },
         {
          label: 'scrollBoard.align',
          key: 'align',
          default: { aligns: [] },
          comType: 'columnAlign',
        },
      ],
    },
  ],
  i18ns: [
    {
      lang: 'zh-CN',
      translation: {
        scrollBoard: {
          basic: '基础样式',
          rowNum: '行数',
          waitTime: '轮播间隔(ms)',
          headerHeight: '表头高度',
          carousel: '轮播方向',
          hoverPause: '悬停暂停',
          header: '表头样式',
          headerBGC: '表头背景色',
          headerFont: '表头字体',
          headerAlign: '表头对齐',
          index: '显示序号列',
          indexHeader: '序号列表头',
          indexAlign: '序号列对齐',
          body: '表体样式',
          oddRowBGC: '奇数行背景色',
          evenRowBGC: '偶数行背景色',
          bodyFont: '数据行字体',
          column: '对齐方式',
          align: '对齐方式',
          carouselOptions: {
            single: '单条',
            page: '整页',
          },
          alignOptions: {
            left: '左对齐',
            center: '居中',
            right: '右对齐',
          },
        },
        pivot: {
          column: {
            noMetrics: '请先添加指标字段',
            widthPlaceholder: '列宽',
            configure: '配置',
          },
        },
        columnAlign: {
          configure: '配置',
          noFields: '请先添加字段',
          options: {
            left: '左对齐',
            center: '居中',
            right: '右对齐',
          },
        },
      },
    },
    {
      lang: 'en-US',
      translation: {
        scrollBoard: {
          basic: 'Basic Style',
          rowNum: 'Row Num',
          waitTime: 'Wait Time(ms)',
          headerHeight: 'Header Height',
          carousel: 'Carousel',
          hoverPause: 'Hover Pause',
          header: 'Header Style',
          headerBGC: 'Header Background Color',
          headerFont: 'Header Font',
          headerAlign: 'Header Align',
          index: 'Show Index',
          indexHeader: 'Index Header',
          indexAlign: 'Index Column Align',
          body: 'Body Style',
          oddRowBGC: 'Odd Row Background Color',
          evenRowBGC: 'Even Row Background Color',
          bodyFont: 'Data Row Font',
          column: 'Column Align',
          align: 'Column Align',
          carouselOptions: {
            single: 'Single',
            page: 'Page',
          },
          alignOptions: {
            left: 'Left',
            center: 'Center',
            right: 'Right',
          },
        },
        pivot: {
          column: {
            noMetrics: 'Please add metric fields first',
            widthPlaceholder: 'Width',
            configure: 'Configure',
          },
        },
        columnAlign: {
          configure: 'Configure',
          noFields: 'Please add fields first',
          options: {
            left: 'Left',
            center: 'Center',
            right: 'Right',
          },
        },
      },
    },
  ],
};

export default config;
