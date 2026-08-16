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
import { ChartStyleSectionComponentType } from 'app/constants';
import { ORIGINAL_TYPE_MAP } from 'app/pages/DashBoardPage/constants';
import type {
  WidgetActionListItem,
  widgetActionType,
  WidgetMeta,
  WidgetProto,
  WidgetToolkit,
} from 'app/pages/DashBoardPage/types/widgetTypes';
import { getJsonConfigs } from 'app/pages/DashBoardPage/utils';
import {
  initBackgroundTpl,
  initBorderTpl,
  initPaddingTpl,
  initTitleTpl,
  initWidgetName,
  PaddingI18N,
  TitleI18N,
  widgetTpl,
} from '../../WidgetManager/utils/init';

const initBorderWidgetTpl = () => {
  return {
    label: 'borderWidget.borderGroup',
    key: 'borderWidgetGroup',
    comType: ChartStyleSectionComponentType.GROUP,
    rows: [
      {
        label: 'borderWidget.type',
        key: 'type',
        value: 1,
        comType: ChartStyleSectionComponentType.SELECT,
        options: {
          translateItemLabel: true,
          items: [
            { label: 'borderWidget.style1', value: 0 },
            { label: 'borderWidget.style2', value: 1 },
            { label: 'borderWidget.style3', value: 2 },
            { label: 'borderWidget.style4', value: 3 },
            { label: 'borderWidget.style5', value: 4 },
            { label: 'borderWidget.style6', value: 5 },
            { label: 'borderWidget.style7', value: 6 },
            { label: 'borderWidget.style8', value: 7 },
            { label: 'borderWidget.style9', value: 8 },
            { label: 'borderWidget.style10', value: 9 },
            { label: 'borderWidget.style11', value: 10 },
            { label: 'borderWidget.style12', value: 11 },
            { label: 'borderWidget.style13', value: 12 },
          ],
        },
      },
      {
        label: 'borderWidget.firstColor',
        key: 'firstColor',
        value: '#4fd2dd',
        comType: ChartStyleSectionComponentType.FONT_COLOR,
      },
      {
        label: 'borderWidget.secondColor',
        key: 'secondColor',
        value: '#235fa7',
        comType: ChartStyleSectionComponentType.FONT_COLOR,
      },
      {
        label: 'borderWidget.title',
        key: 'title',
        value: '',
        comType: ChartStyleSectionComponentType.INPUT,
        watcher: {
          deps: ['type'],
          action: props => {
            return {
              hidden: props.type !== 10,
            };
          },
        },
      },
      {
        label: 'borderWidget.titleWidth',
        key: 'titleWidth',
        value: 120,
        comType: ChartStyleSectionComponentType.INPUT_NUMBER,
        watcher: {
          deps: ['type'],
          action: props => {
            return {
              hidden: props.type !== 10,
            };
          },
        },
      },
      {
        label: 'borderWidget.titleFont',
        key: 'titleFont',
        value: {
          fontFamily: 'Microsoft YaHei',
          fontSize: '18',
          fontWeight: 'normal',
          fontStyle: 'normal',
          color: '#ffffff',
        },
        comType: ChartStyleSectionComponentType.FONT,
        watcher: {
          deps: ['type'],
          action: props => {
            return {
              hidden: props.type !== 10,
            };
          },
        },
      },
    ],
  };
};
const borderWidgetI18N = {
  zh: {
    borderGroup: '边框配置',
    type: '样式',
    firstColor: '主颜色',
    secondColor: '副颜色',
    style1: '样式1',
    style2: '样式2',
    style3: '样式3',
    style4: '样式4',
    style5: '样式5',
    style6: '样式6',
    style7: '样式7',
    style8: '样式8',
    style9: '样式9',
    style10: '样式10',
    style11: '样式11',
    style12: '样式12',
    style13: '样式13',
    title: '边框标题',
    titleWidth: '标题宽度',
    titleFont: '标题字体',
  },
  en: {
    borderGroup: 'Border Config',
    type: 'Style',
    firstColor: 'Primary Color',
    secondColor: 'Secondary Color',
    style1: 'Style 1',
    style2: 'Style 2',
    style3: 'Style 3',
    style4: 'Style 4',
    style5: 'Style 5',
    style6: 'Style 6',
    style7: 'Style 7',
    style8: 'Style 8',
    style9: 'Style 9',
    style10: 'Style 10',
    style11: 'Style 11',
    style12: 'Style 12',
    style13: 'Style 13',
    title: 'Border Title',
    titleWidth: 'Title Width',
    titleFont: 'Title Font',
  },
};
const NameI18N = {
  zh: '边框',
  en: 'Border',
};
export const widgetMeta: WidgetMeta = {
  icon: 'border-widget',
  originalType: ORIGINAL_TYPE_MAP.border,
  canWrapped: true,
  controllable: false,
  linkable: false,
  canFullScreen: true,
  singleton: false,

  i18ns: [
    {
      lang: 'zh-CN',
      translation: {
        desc: 'border',
        widgetName: NameI18N.zh,
        action: {},
        borderWidget: borderWidgetI18N.zh,
        title: TitleI18N.zh,
        background: { backgroundGroup: '背景' },
        padding: PaddingI18N.zh,
        border: { borderGroup: '边框' },
      },
    },
    {
      lang: 'en-US',
      translation: {
        desc: 'border',
        widgetName: NameI18N.en,
        action: {},
        borderWidget: borderWidgetI18N.en,
        title: TitleI18N.en,
        background: { backgroundGroup: 'Background' },
        padding: PaddingI18N.en,
        border: { borderGroup: 'Border' },
      },
    },
  ],
};
export interface BorderWidgetToolKit extends WidgetToolkit {
  getBorderConfig: (props) => {
    type: number;
    firstColor: string;
    secondColor: string;
    title: string;
    titleWidth: number;
    titleFont: {
      fontFamily: string;
      fontSize: string;
      fontWeight: string;
      fontStyle: string;
      color: string;
    };
  };
}
export const widgetToolkit: BorderWidgetToolKit = {
  create: opt => {
    const widget = widgetTpl();
    widget.id = widgetMeta.originalType + widget.id;
    widget.parentId = opt.parentId || '';
    widget.viewIds = opt.viewIds || [];
    widget.relations = opt.relations || [];
    widget.config.originalType = widgetMeta.originalType;
    widget.config.type = 'media';
    widget.config.name = opt.name || '';
    widget.config.rect.height = 100;
    widget.config.pRect.height = 3;

    widget.config.customConfig.props = [
      { ...initBorderWidgetTpl() },
      { ...initTitleTpl() },
      { ...initBackgroundTpl() },
      { ...initPaddingTpl() },
      { ...initBorderTpl() },
    ];

    return widget;
  },
  getName(key) {
    return initWidgetName(NameI18N, key);
  },
  edit() {},
  save() {},
  getDropDownList(...arg) {
    const list: WidgetActionListItem<widgetActionType>[] = [
      {
        key: 'edit',
        renderMode: ['edit'],
      },
      {
        key: 'delete',
        renderMode: ['edit'],
      },
      {
        key: 'lock',
        renderMode: ['edit'],
      },
      {
        key: 'group',
        renderMode: ['edit'],
      },
    ];
    return list;
  },
  getBorderConfig(props) {
    const [type, firstColor, secondColor, title, titleWidth, titleFont] =
      getJsonConfigs(
        props,
        ['borderWidgetGroup'],
        [
          'type',
          'firstColor',
          'secondColor',
          'title',
          'titleWidth',
          'titleFont',
        ],
      ) as [
        number,
        string,
        string,
        string,
        number,
        {
          fontFamily: string;
          fontSize: string;
          fontWeight: string;
          fontStyle: string;
          color: string;
        },
      ];
    return {
      type: type ?? 1,
      firstColor: firstColor ?? '#4fd2dd',
      secondColor: secondColor ?? '#235fa7',
      title: title ?? '',
      titleWidth: titleWidth ?? 120,
      titleFont: titleFont ?? {
        fontFamily: 'Microsoft YaHei',
        fontSize: '18',
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#ffffff',
      },
    };
  },
};

const borderProto: WidgetProto = {
  originalType: widgetMeta.originalType,
  meta: widgetMeta,
  toolkit: widgetToolkit,
};
export const borderToolkit = widgetToolkit;
export default borderProto;
